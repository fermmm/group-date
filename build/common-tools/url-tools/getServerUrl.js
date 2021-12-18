"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerUrl = void 0;
const process_tools_1 = require("../process/process-tools");
function getServerUrl() {
    const hostName = process_tools_1.isProductionMode() ? process.env.SERVER_URL : process.env.SERVER_URL_DEVELOPMENT;
    let withPort = hostName;
    if (!process_tools_1.isProductionMode()) {
        withPort += ":" + process.env.PORT;
    }
    let withProtocol = withPort;
    if (process_tools_1.isProductionMode() && process.env.HTTPS_PORT_ENABLED) {
        withProtocol = "https://" + withProtocol;
    }
    else {
        withProtocol = "http://" + withProtocol;
    }
    return withProtocol;
}
exports.getServerUrl = getServerUrl;
//# sourceMappingURL=getServerUrl.js.map