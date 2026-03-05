const express = require('express');
const router = express.Router();
const https = require('https');

router.post('/chat', async (req, res) => {
    try {
        const { question, branch } = req.body;
        // Trim the API key to prevent hidden whitespace issues
        const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
            return res.status(500).json({ answer: "System configuration error: AI key missing." });
        }

        const prompt = `You are an expert engineering tutor for a student in the ${branch} department at Bharati Vidyapeeth College of Engineering, Pune. Answer this question clearly and concisely: ${question}`;

        const postData = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        // Re-ordered model list prioritizing 1.5 versions and using v1beta for all
        const modelConfigs = [
            { name: 'gemini-1.5-flash', version: 'v1beta' },
            { name: 'gemini-1.5-flash-8b', version: 'v1beta' },
            { name: 'gemini-2.0-flash', version: 'v1beta' },
            { name: 'gemini-2.0-flash-lite', version: 'v1beta' },
            { name: 'gemini-1.5-pro', version: 'v1beta' }
        ];

        let answer = null;
        let lastError = null;

        for (const config of modelConfigs) {
            try {
                console.log(`Attempting AI Chat with ${config.name} (${config.version})...`);
                answer = await new Promise((resolve, reject) => {
                    const options = {
                        hostname: 'generativelanguage.googleapis.com',
                        path: `/${config.version}/models/${config.name}:generateContent?key=${apiKey}`,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        },
                        timeout: 30000
                    };

                    const request = https.request(options, (response) => {
                        let body = '';
                        response.on('data', chunk => body += chunk);
                        response.on('end', () => {
                            if (response.statusCode === 200) {
                                try {
                                    const data = JSON.parse(body);
                                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    resolve(text || "No response generated.");
                                } catch (e) {
                                    reject(new Error(`JSON Parse Error: ${e.message}`));
                                }
                            } else {
                                reject(new Error(`Gemini Error HTTP ${response.statusCode}: ${body.substring(0, 100)}`));
                            }
                        });
                    });

                    request.on('error', reject);
                    request.on('timeout', () => {
                        request.destroy();
                        reject(new Error('Gemini Request Timed Out'));
                    });
                    request.write(postData);
                    request.end();
                });

                if (answer) {
                    console.log(`Success with ${config.name}!`);
                    break;
                }
            } catch (err) {
                console.warn(`Model ${config.name} failed: ${err.message}`);
                lastError = err;
                // Continue for 429 (Rate Limit), 404 (Not Found), or 503 (Unavailable)
                if (err.message.includes('429') || err.message.includes('404') || err.message.includes('503')) {
                    continue;
                }
                break; // Stop on other critical errors
            }
        }

        if (answer) {
            res.json({ answer });
        } else {
            throw lastError || new Error("All Gemini models failed.");
        }

    } catch (err) {
        console.error("Gemini Chat Error:", err.message);
        res.status(503).json({
            answer: "The AI tutor is temporarily busy. Please wait a minute and try again.",
            details: err.message
        });
    }
});

module.exports = router;
