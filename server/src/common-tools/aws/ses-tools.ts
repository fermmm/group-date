import * as nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import Mail = require("nodemailer/lib/mailer");

const ses = new aws.SES({
   apiVersion: "2010-12-01",
   region: process.env.AWS_REGION,
});

let transporter = nodemailer.createTransport({
   SES: { ses, aws },
});

// Sends an email using nodemailer and AWS SES
export async function sendEmailUsingSES(props: Mail.Options) {
   return await transporter.sendMail(props);
}
