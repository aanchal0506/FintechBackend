require("dotenv").config();
//console.log("EMAIL_USER:", process.env.EMAIL_USER);
//console.log("CLIENT_ID:", process.env.CLIENT_ID);
//console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET ? "Loaded" : "Missing");
//console.log("REFRESH_TOKEN:",process.env.REFRESH_TOKEN ? "Loaded" : "Missing");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify email configuration
transporter.verify((error) => {
    if (error) {
        console.error("Error connecting to email server:");
        console.error(error);
    } else {
        console.log("Email server is ready to send messages");
    }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        // console.log("Starting email sending...");
        // console.log("To:", to);
        // console.log("Subject:", subject);
        const info = await transporter.sendMail({
            from: `"Fintech Backend" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        });

        //  console.log("EMAIL SENT SUCCESSFULLY");
        // console.log("Message ID:", info.messageId);
        // console.log("Accepted:", info.accepted);
        // console.log("Rejected:", info.rejected);

    } catch (error) {
        console.error("Error sending email:");
        console.error(error);
    }
};

async function sendRegistrationEmail(userEmail, name) {
    // console.log("📨 sendRegistrationEmail called");
    // console.log("Recipient:", userEmail);
    // console.log("Name:", name);

    const subject = "Welcome to Fintech Backend";

    const text = `
Hi ${name},

Welcome to Fintech Backend!

Your account has been successfully created. We're happy to have you with us.

You can now log in and start using the platform.

If you did not create this account, please contact our support team immediately.

Best regards,
Fintech Backend Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Fintech Backend</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">

    <div style="max-width: 600px; margin: auto; background-color: white; padding: 30px; border-radius: 10px;">

        <h2>Welcome, ${name}! </h2>

        <p>Your account has been successfully created.</p>

        <p>
            We're happy to have you with us.
            You can now log in and start using the Fintech Backend platform.
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173"
               style="background-color: #007bff;
                      color: white;
                      padding: 12px 25px;
                      text-decoration: none;
                      border-radius: 5px;">
                Login to Your Account
            </a>
        </div>

        <p style="color: #777; font-size: 14px;">
            If you did not create this account, please contact our support team immediately.
        </p>

        <p>
            Best regards,<br>
            <strong>Fintech Backend Team</strong>
        </p>

    </div>

</body>
</html>
`;
    console.log("send email is working")
    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail
};