import nodemailer from 'nodemailer'

export const onMailer = async (email, empId, password) => {
    console.log(email, empId, password);
    const transporter = nodemailer.createTransport({
        host: "smpt.gamil.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.NODE_MAILER_EMAIL,
            pass: process.env.NODE_GMAIL_APP_PASSWORD,
        },
    });
    console.log("transport:", transporter);
    const mailOptions = {
         from: process.env.NODE_MAILER_EMAIL,
         to: email,     
         subject: 'Student Login Credentials',
         text: `A new student has been create with the following login credentials ;
         Student Id: ${empId}
         Student password : ${password}`
    };
    console.log("mailOptions", mailOptions);
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email send : ", + info.response);
        return true;
    } catch (error) {
        console.log(error)
        return false
    }
};

