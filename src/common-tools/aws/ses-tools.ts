import * as nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";

// process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
// process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const ses = new aws.SES({
   apiVersion: "2010-12-01",
   region: process.env.AWS_REGION,
});

let transporter = nodemailer.createTransport({
   SES: { ses, aws },
});

// Sends an email using nodemailer and AWS SES
export async function sendEmailUsingSES(props: { to: string; subject: string; text: string; html?: string }) {
   return await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      ...props,
   });
}
