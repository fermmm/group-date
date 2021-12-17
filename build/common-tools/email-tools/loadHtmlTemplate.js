"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandardUrls = exports.loadHtmlTemplate = void 0;
const nunjucks = require("nunjucks");
/**
 *
 * @param applyStandardVariables Default: true: Replaces variables for the logo url and other standard urls
 * @returns
 */
function loadHtmlTemplate(props) {
    const { htmlFilePath, variablesToReplace, applyStandardVariables = true } = props;
    nunjucks.configure({ autoescape: true });
    return nunjucks.render(htmlFilePath, variablesToReplace);
}
exports.loadHtmlTemplate = loadHtmlTemplate;
function getStandardUrls() {
    return {
        logoUrl: "https://www.nhs.uk/live/design/favicon/apple-touch-icon-precomposed.png",
    };
}
exports.getStandardUrls = getStandardUrls;
//# sourceMappingURL=loadHtmlTemplate.js.map