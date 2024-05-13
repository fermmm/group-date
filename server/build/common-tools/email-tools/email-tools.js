"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const ses_tools_1 = require("../aws/ses-tools");
async function sendEmail(props) {
    return (0, ses_tools_1.sendEmailUsingSES)({
        from: `${props.senderName} <${process.env.EMAIL_SENDER}>`,
        ...props,
    });
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=email-tools.js.map