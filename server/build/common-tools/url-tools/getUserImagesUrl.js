"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImagesHostUrl = void 0;
const process_tools_1 = require("../process/process-tools");
function getImagesHostUrl() {
    if ((0, process_tools_1.isProductionMode)()) {
        return process.env.IMAGES_HOST;
    }
    else {
        return process.env.IMAGES_HOST_DEVELOPMENT;
    }
}
exports.getImagesHostUrl = getImagesHostUrl;
//# sourceMappingURL=getUserImagesUrl.js.map