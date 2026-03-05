require('dotenv').config({ path: './.env' });
const https = require('https');
https.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.OPENAI_API_KEY, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            console.log(data.models.map(m => m.name).join('\n'));
        } catch (e) {
            console.log(body);
        }
    });
}).on('error', console.error);
