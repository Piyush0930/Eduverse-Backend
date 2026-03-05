require('dotenv').config({ path: './.env' });
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key:", apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');

const postData = JSON.stringify({
    contents: [{ parts: [{ text: "Hello, reply with just 'OK'" }] }]
});

const urlObj = new URL(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`);

const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const data = JSON.parse(body);
            console.log('Answer:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer');
        } catch (e) {
            console.log('Raw Body:', body);
        }
    });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(postData);
req.end();
