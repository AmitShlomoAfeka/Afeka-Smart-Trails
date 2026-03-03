const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Trip = require('../models/Trip');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});



const { GoogleGenerativeAI } = require('@google/generative-ai');

const axios = require('axios');

const getMockTrip = (country, type, duration) => {
    return {
        title: `Graceful Fallback Trip to ${country}`,
        itinerary: [
            { day: 1, description: "Start at Point A, ride to Point B.", startCoords: [34.7818, 32.0853], endCoords: [35.2137, 31.7683] },
            { day: 2, description: "Ride from Point B to Point C.", startCoords: [35.2137, 31.7683], endCoords: [34.9896, 31.8903] }
        ]
    };
};

// @route   POST /api/trips/generate
// @desc    Generate a trip using LLM and external APIs
router.post('/generate', auth, async (req, res) => {
    const { country, city, type, duration, apiKey, provider = 'openai' } = req.body;

    let tripData;
    let fallbackToMock = false;

    // 1. Generate Coordinates via LLM
    const prompt = `You are a professional travel routing API. I need a JSON response for a ${duration}-day ${type} trip in ${city ? city + ', ' : ''}${country}.
    For "bike" trips: Provide exactly ${duration + 1} realistic city/town stops forming a continuous route. Daily segments must realistically be 30-70km apart.
    For "trek" trips: Provide exactly ${duration + 1} waypoints making a scenic continuous loop or path. Daily segments must realistically be 5-10km apart.
    Return ONLY valid JSON with this exact schema:
    {
        "title": "String, a catchy trip name",
        "itinerary": [
        { "day": 1, "description": "String, what happens today", "startCoords": [lon, lat], "endCoords": [lon, lat] }
        ]
    }`;

    try {
        if (provider === 'gemini') {
            const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
            if (!activeApiKey) {
                return res.status(400).json({ message: 'Google Gemini API Key is required' });
            }
            const genAI = new GoogleGenerativeAI(activeApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            const textResponse = result.response.text();
            tripData = JSON.parse(textResponse);

        } else {
            // Default to OpenAI
            const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
            if (!activeApiKey) {
                return res.status(400).json({ message: 'OpenAI API Key is required' });
            }
            const localOpenai = new OpenAI({ apiKey: activeApiKey });

            const completion = await localOpenai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });
            tripData = JSON.parse(completion.choices[0].message.content);
        }
    } catch (llmErr) {
        console.warn(`LLM Generation Failed for provider ${provider}. Using mock fallback coordinates. Reason:`, llmErr.message);
        fallbackToMock = true;
        tripData = getMockTrip(country, type, duration);
    }

    try {
        // 2. Fetch Real Route via OSRM
        let fullCoordinates = [];
        let totalDistance = 0;
        const osrmProfile = type === 'bike' ? 'cycling' : 'foot';

        // Extract all sequential coordinates
        const waypoints = [tripData.itinerary[0].startCoords];
        tripData.itinerary.forEach(day => waypoints.push(day.endCoords));

        const coordsString = waypoints.map(c => `${c[0]},${c[1]}`).join(';');
        const osrmUrl = `http://router.project-osrm.org/route/v1/${osrmProfile}/${coordsString}?geometries=geojson&overview=full`;

        try {
            const osrmRes = await axios.get(osrmUrl);
            if (osrmRes.data.routes && osrmRes.data.routes.length > 0) {
                fullCoordinates = osrmRes.data.routes[0].geometry.coordinates;
                totalDistance = (osrmRes.data.routes[0].distance / 1000).toFixed(1); // Convert meters to km
            }
        } catch (e) {
            console.error("OSRM Error:", e.message);
            // Fallback to straight lines if OSRM fails
            fullCoordinates = waypoints;
        }

        tripData.route = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: fullCoordinates
                    }
                }
            ]
        };
        tripData.totalDistanceKm = totalDistance;

        // 3. Fetch Real Weather via Open-Meteo (First coordinate)
        const [startLon, startLat] = waypoints[0];
        try {
            const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${startLat}&longitude=${startLon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`);

            tripData.weather = {
                forecast: "3-Day Local Forecast",
                details: weatherRes.data.daily.time.map((date, index) => ({
                    date: date,
                    maxTemp: weatherRes.data.daily.temperature_2m_max[index],
                    minTemp: weatherRes.data.daily.temperature_2m_min[index],
                    code: weatherRes.data.daily.weather_code[index]
                }))
            };
        } catch (e) {
            console.error("Weather Error:", e.message);
            tripData.weather = { forecast: "Weather unavailable", details: [] };
        }

        // 4. Generate Image via Google Image Search
        try {
            const url = `https://www.google.com/search?q=${encodeURIComponent(country + " scenic landscape")}&tbm=isch`;
            const searchRes = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });

            const imgMatch = searchRes.data.match(/\["([^"]+\.(?:jpg|jpeg|png))",\d+,\d+\]/i);
            if (imgMatch && imgMatch[1]) {
                tripData.imageUrl = JSON.parse(`"${imgMatch[1]}"`); // Parse to unescape unicode like \u003d
            } else {
                console.warn("No high-res image found in HTML sequence. Skipping image.");
                tripData.imageUrl = null;
            }
        } catch (e) {
            console.warn("Google Image Search error:", e.message);
            tripData.imageUrl = null;
        }

        tripData.country = country;
        tripData.type = type;
        tripData.duration = duration;

        res.json(tripData);
    } catch (err) {
        console.error("Trip Gen Server Error:", err.message);
        res.status(500).json({ message: 'Server Error during generation', error: err.message });
    }
});

// @route   POST /api/trips/save
// @desc    Save an approved trip
router.post('/save', auth, async (req, res) => {
    try {
        const { title, country, city, type, duration, routeData, imageUrl, totalDistanceKm, weatherForecast, itinerary } = req.body;

        const newTrip = new Trip({
            userId: req.user.id,
            title,
            country,
            city,
            type,
            duration,
            routeData,
            imageUrl,
            totalDistanceKm,
            weatherForecast,
            itinerary
        });

        const trip = await newTrip.save();
        res.json(trip);
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).send('Server Error saving trip');
    }
});

// @route   GET /api/trips/history
// @desc    Get all trips for user
router.get('/history', auth, async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error fetching history');
    }
});

// @route   GET /api/trips/history/:id
// @desc    Get a single trip by ID for the logged in user
router.get('/history/:id', auth, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Make sure user owns this trip
        if (trip.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        res.json(trip);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Trip not found' });
        }
        res.status(500).send('Server Error fetching trip details');
    }
});

module.exports = router;
