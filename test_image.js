const axios = require('axios');

async function testGoogleImageSearch(query) {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const res = await axios.get(url);
        if (res.data && res.data.originalimage) {
            console.log("Wikipedia Image:", res.data.originalimage.source);
        } else {
            console.log("No Wikipedia image found.");
        }
    } catch (e) {
        console.error("Wiki error:", e.message);
    }
}

async function testWikimediaSearch(query) {
    try {
        // Search wikimedia commons for landscape of country
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
        const res = await axios.get(url);
        const pages = res.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1' && pages[pageId].original) {
            console.log("Wiki API Image:", pages[pageId].original.source);
        } else {
            console.log("No Wiki API image.");
        }
    } catch (e) {
        console.error("Wiki API error");
    }
}

// Another option is to use duckduckgo image search or similar free endpoints.

testGoogleImageSearch('Israel');
testWikimediaSearch('Israel');
