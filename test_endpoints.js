const https = require('https');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        // Use http for localhost
        const http = require('http');
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                console.log(`\n=== ${path} ===`);
                console.log('Status:', res.statusCode);
                try {
                    const json = JSON.parse(data);
                    console.log('Response:', JSON.stringify(json).substring(0, 500));
                } catch (e) {
                    console.log('Raw:', data.substring(0, 500));
                }
                resolve();
            });
        });
        req.on('error', e => {
            console.error(`Error on ${path}:`, e.message);
            resolve();
        });
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('Testing AI Chat...');
    await post('/api/ai/chat', { question: 'What is Newton\'s first law?', branch: 'Mechanical Engineering' });

    console.log('\nTesting Quiz Generation...');
    await post('/api/quiz/generate-quiz', { topic: 'Thermodynamics' });
}

main();
