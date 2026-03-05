const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (user) => {
    console.log(`[EmailService] Starting welcome email for: ${user.email}`);
    let aiMessage = `Welcome to EduVerse AI, ${user.name}! We're thrilled to have you join our ${user.branch} community at Bharati Vidyapeeth College of Engineering. Explore your dashboard for recommended courses and AI tools to help you succeed!`;

    try {
        console.log(`[EmailService] Requesting AI content from Gemini via Fetch...`);
        const apiKey = process.env.OPENAI_API_KEY; // Using existing variable for Google Key
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Write a short, professional, and welcoming email for a new student named ${user.name} who joined the ${user.branch} department at Bharati Vidyapeeth College of Engineering. Keep it concise.` }]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            aiMessage = data.candidates[0].content.parts[0].text;
            console.log(`[EmailService] AI Content generated successfully.`);
        }
    } catch (err) {
        console.error(`[EmailService] Gemini Fetch Error (Using fallback):`, err.message);
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Welcome to EduVerse AI 🎓',
            text: aiMessage,
        };

        console.log(`[EmailService] Sending email...`);
        await transporter.sendMail(mailOptions);
        console.log(`[EmailService] SUCCESS: Welcome email sent to ${user.email}`);
    } catch (err) {
        console.error(`[EmailService] Nodemailer Error:`, err.message);
    }
};

module.exports = { sendWelcomeEmail };
