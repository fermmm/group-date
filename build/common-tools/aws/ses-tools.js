"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailUsingSES = void 0;
const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");
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
async function sendEmailUsingSES(props) {
    return await transporter.sendMail({
        from: process.env.EMAIL_SENDER,
        ...props,
    });
}
exports.sendEmailUsingSES = sendEmailUsingSES;
//# sourceMappingURL=ses-tools.js.map