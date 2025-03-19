import nodemailer from 'nodemailer';

const  transporter = nodemailer.createTransport({
      host: "pop.gmail.com",
      port: 465,
      auth: {
        user: "@gmail.com",
        pass: ""
      }
})

module.exports = transporter;
