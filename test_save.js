const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = { user: { id: "60d0fe4f5311236168a109ca", username: "test_verification" } };
const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

const testSave = async () => {
    try {
        console.log('Sending test request to /api/trips/save...');

        const tripPayload = {
            title: "Test Save Trip",
            country: 'Italy',
            city: 'Rome',
            type: 'bike',
            duration: 1,
            routeData: { type: "FeatureCollection", features: [] },
            imageUrl: "http://example.com/image.jpg",
            totalDistanceKm: 42,
            weatherForecast: { forecast: "Sunny" },
            itinerary: [
                { day: 1, description: "Do this today" }
            ]
        };

        const generateRes = await axios.post('http://localhost:5000/api/trips/save', tripPayload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('\n✅ Save Success!\nID:', generateRes.data._id);

    } catch (e) {
        console.error('❌ Save failed:', e.response?.data || e.message);
    }
}

testSave();
