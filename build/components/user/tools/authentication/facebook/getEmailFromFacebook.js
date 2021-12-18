"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailFromFacebook = void 0;
const httpRequest_1 = require("../../../../../common-tools/httpRequest/httpRequest");
async function getEmailFromFacebook(token, ctx) {
    const userDataFromFacebook = await httpRequest_1.httpRequest({
        url: `https://graph.facebook.com/me?fields=email&access_token=${token}`,
    });
    if (userDataFromFacebook.success === false) {
        ctx.throw(400, userDataFromFacebook.error.message);
        return;
    }
    if (!userDataFromFacebook.content) {
        ctx.throw(400, "userDataFromFacebook.content is null");
        return;
    }
    if (!userDataFromFacebook.content.email) {
        ctx.throw(400, "userDataFromFacebook.content.email is null");
        return;
    }
    return userDataFromFacebook.content.email;
}
exports.getEmailFromFacebook = getEmailFromFacebook;
//# sourceMappingURL=getEmailFromFacebook.js.map