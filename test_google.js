const axios = require('axios');

async function getGoogleImage(query) {
    try {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query + " landscape")}&tbm=isch`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });

        // Try extracting the raw original url using a basic Regex pattern
        // The images are often hidden in arrays in the HTML script tags
        // Alternatively, finding the first <img src="http..."> 
        const html = res.data;

        // Simple regex to find external image Links:
        const imgMatch = html.match(/\["([^"]+\.(?:jpg|jpeg|png))",\d+,\d+\]/i);

        if (imgMatch && imgMatch[1]) {
            console.log("Found High Res URL:", JSON.parse(`"${imgMatch[1]}"`));
            return;
        }

        // Fallback to the thumbnail images <img src="...">
        const thumbMatch = html.match(/<img[^>]+src="([^">]+)"/g);
        if (thumbMatch && thumbMatch.length > 1) {
            // thumbMatch[0] is usually the nav icon
            const src = thumbMatch[1].match(/src="([^"]+)"/)[1];
            console.log("Found Thumbnail URL:", src);
        } else {
            console.log("No images found in HTML.");
        }

    } catch (e) {
        console.error("Scraper Error:", e.message);
    }
}

getGoogleImage("Israel");
