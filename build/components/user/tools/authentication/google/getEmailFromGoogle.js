"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailFromGoogle = void 0;
const httpRequest_1 = require("../../../../../common-tools/httpRequest/httpRequest");
async function getEmailFromGoogle(token, ctx) {
    const userDataFromGoogle = await (0, httpRequest_1.httpRequest)({
        url: `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`,
    });
    if (userDataFromGoogle.success === false) {
        ctx.throw(401, userDataFromGoogle.error.message);
        return;
    }
    if (!userDataFromGoogle.content) {
        ctx.throw(401, "userDataFromFacebook.content is null");
        return;
    }
    if (!userDataFromGoogle.content.email) {
        ctx.throw(401, "userDataFromFacebook.content.email is null");
        return;
    }
    return userDataFromGoogle.content.email;
}
exports.getEmailFromGoogle = getEmailFromGoogle;
//# sourceMappingURL=getEmailFromGoogle.js.map