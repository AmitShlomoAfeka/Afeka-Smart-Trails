const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    // Look for an API key in the environment or args
    const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key provided. Run with: node test_gemini.js <YOUR_API_KEY>");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional travel routing API. I need a JSON response for a 1-day bike trip in Rome, Italy.
    For "bike" trips: Provide exactly 2 realistic city/town stops forming a continuous route. Daily segments must realistically be 30-70km apart.
    Return ONLY valid JSON with this exact schema:
    {
        "title": "String, a catchy trip name",
        "itinerary": [
            { "day": 1, "description": "String, what happens today", "startCoords": [lon, lat], "endCoords": [lon, lat] }
        ]
    }`;

    console.log("Testing generateContent...");
    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const textResponse = result.response.text();
        console.log("Raw Response:", textResponse);

        try {
            const parsed = JSON.parse(textResponse);
            console.log("Successfully parsed JSON:", Object.keys(parsed));
        } catch (e) {
            console.error("JSON Parse Error:", e.message);
        }
    } catch (e) {
        console.error("GoogleGenerativeAI Error:", e);
    }
}

testGemini();
