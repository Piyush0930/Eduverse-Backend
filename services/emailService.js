const nodemailer = require('nodemailer');

/**
 * Sends a welcome email to a newly signed-up user.
 * This version uses a professional static template instead of Gemini AI for reliability.
 */
const sendWelcomeEmail = async (user) => {
    console.log(`[EmailService] Preparing static welcome email for: ${user.email}`);

    // Professional static template with personalization
    const welcomeMessage = `
Dear ${user.name},

Welcome to EduVerse AI! 🎓

We are thrilled to have you join our academic community. Whether you're exploring the latest in ${user.branch} or using our AI-powered study tools, we're here to support your engineering journey at Bharati Vidyapeeth College of Engineering.

Your account is now active. You can log in to your dashboard to:
- Access personalized course recommendations for ${user.branch}.
- Chat with our expert AI Academic Tutor.
- Generate custom quizzes to test your knowledge.

We're excited to see what you'll achieve!

Best regards,
The EduVerse AI Team
    `;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"EduVerse AI" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Welcome to EduVerse AI - Let\'s Start Learning! 🎓',
            text: welcomeMessage.trim(),
        };

        console.log(`[EmailService] Sending welcome email...`);
        await transporter.sendMail(mailOptions);
        console.log(`[EmailService] SUCCESS: Welcome email sent to ${user.email}`);
    } catch (err) {
        console.error(`[EmailService] Nodemailer Error:`, err.message);
    }
};

module.exports = { sendWelcomeEmail };
