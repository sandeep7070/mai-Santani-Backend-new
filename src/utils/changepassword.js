import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()
async function sendPasswordRestEmail(email, genretedOTP) {
    const transporter = nodemailer.createTransport({
        host: "smp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.NODE_MAILER_EMAIL,
            pass: process.env.NODE_MAILER_GMAIL_APP_PASSWORD,
        }
    });

    const resetLink =`${process.env.APP_URL}/rest-password`;

    const MailOptions = {
        from: process.env.NODE_MAILER_EMAIL,
        to: email,
        subject: "Rest your password",
        text: `Plase click the following link to rest your password: ${resetLink} \n OTP for change password: ${genretedOTP}`
    };
    try {
        await transporter.sendMail(MailOptions)
        return true;
    } catch (error) {
        console.log("Error sending password rest email:", error)
        return false;
    }

}

export default sendPasswordRestEmail;