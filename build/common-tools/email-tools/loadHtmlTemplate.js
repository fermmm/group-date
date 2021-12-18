"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandardUrls = exports.loadHtmlEmailTemplate = void 0;
const nunjucks = require("nunjucks");
const configurations_1 = require("../../configurations");
const i18n_tools_1 = require("../i18n-tools/i18n-tools");
const getServerUrl_1 = require("../url-tools/getServerUrl");
/**
 * Returns an html file as string with styles. Contains variables in format: {{ variable }} to be
 * replaced by the values in the variablesToReplace object.
 */
function loadHtmlEmailTemplate(props) {
    const { htmlFilePath = "websites/email-templates/general.html", variablesToReplace, translationSources, } = props;
    nunjucks.configure({ autoescape: true });
    return nunjucks.render(htmlFilePath, { ...getStandardUrls(translationSources), ...variablesToReplace });
}
exports.loadHtmlEmailTemplate = loadHtmlEmailTemplate;
function getStandardUrls(translationSources) {
    const emailImagesFolderUrl = (0, getServerUrl_1.getServerUrl)() + "/email-images/";
    return {
        title: "",
        content: "",
        footerText: (0, i18n_tools_1.t)(configurations_1.APPLICATION_NAME_COMPLETE, translationSources),
        logoUrl: emailImagesFolderUrl + "logo.svg",
        googlePlayImageUrl: emailImagesFolderUrl + "buttonGooglePlay.svg",
        appStoreImageUrl: emailImagesFolderUrl + "appStoreButton.svg",
        googlePlayUrl: configurations_1.GOOGLE_PLAY_URL,
        appStoreUrl: configurations_1.APP_STORE_URL,
    };
}
exports.getStandardUrls = getStandardUrls;
//# sourceMappingURL=loadHtmlTemplate.js.map