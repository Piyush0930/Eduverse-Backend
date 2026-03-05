const express = require('express');
const router = express.Router();
const https = require('https');

router.post('/generate-quiz', async (req, res) => {
    try {
        const { topic } = req.body;
        // Trim the API key to prevent hidden whitespace issues
        const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
            return res.status(500).json({ error: "System configuration error: AI key missing." });
        }

        const promptText = `Generate a 5-question multiple choice quiz about "${topic}".
Return ONLY a valid JSON array of exactly 5 objects, no explanation, no markdown.
Each object must have:
- "question": a string with the quiz question
- "options": an array of exactly 4 answer strings
- "correctAnswer": an integer 0-3 indicating which option is correct

Example format:
[{"question":"What is X?","options":["A","B","C","D"],"correctAnswer":2}]`;

        const postData = JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
        });

        // Re-ordered model list prioritizing 1.5 versions and using v1beta for all
        const modelConfigs = [
            { name: 'gemini-1.5-flash', version: 'v1beta' },
            { name: 'gemini-1.5-flash-8b', version: 'v1beta' },
            { name: 'gemini-2.0-flash', version: 'v1beta' },
            { name: 'gemini-2.0-flash-lite', version: 'v1beta' }
        ];

        let rawText = null;
        let lastError = null;

        for (const config of modelConfigs) {
            try {
                console.log(`Attempting Quiz Generation with ${config.name} (${config.version})...`);
                rawText = await new Promise((resolve, reject) => {
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
                                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                    resolve(text);
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

                if (rawText) {
                    console.log(`Success with ${config.name}! Parsing output...`);
                    break;
                }
            } catch (err) {
                console.warn(`Quiz model ${config.name} failed: ${err.message}`);
                lastError = err;
                if (err.message.includes('429') || err.message.includes('404') || err.message.includes('503')) {
                    continue;
                }
                break;
            }
        }

        if (!rawText) throw lastError || new Error("All Gemini models failed.");

        // Clean and parse JSON from the AI response
        let text = rawText.trim();
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            text = codeBlockMatch[1].trim();
        }

        try {
            const parsedData = JSON.parse(text);
            const questions = Array.isArray(parsedData) ? parsedData : (parsedData.questions || parsedData.quiz || []);

            if (Array.isArray(questions) && questions.length > 0) {
                res.json(questions);
            } else {
                throw new Error("No questions found in AI response");
            }
        } catch (parseErr) {
            console.error("Quiz Parse Error. Raw Text:", rawText);
            res.status(500).json({ error: "The AI sent an invalid format. Please try again." });
        }

    } catch (err) {
        console.error("Internal Server Error in Quiz Generation:", err);
        res.status(503).json({
            error: "Quiz generation is temporarily busy. Please try again shortly.",
            details: err.message
        });
    }
});

module.exports = router;
