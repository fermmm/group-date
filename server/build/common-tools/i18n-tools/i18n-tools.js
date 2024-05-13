"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocaleFromHeader = exports.findLocaleIn = exports.t = void 0;
const i18n = require("i18n");
const configurations_1 = require("../../configurations");
/**
 * Returns a translation to the provided string
 */
const t = (phraseOrOptions, sources, ...replace) => {
    i18n.setLocale(findLocaleIn(sources));
    return i18n.__(phraseOrOptions, ...replace);
};
exports.t = t;
/**
 * Returns the user language, optionally from ctx or from the user. If it's not found returns the
 * default language from DEFAULT_LANGUAGE.
 */
function findLocaleIn(sources) {
    var _a;
    let locale;
    if (((_a = sources === null || sources === void 0 ? void 0 : sources.user) === null || _a === void 0 ? void 0 : _a.language) != null) {
        locale = sources.user.language;
    }
    else if ((sources === null || sources === void 0 ? void 0 : sources.ctx) != null) {
        locale = getLocaleFromHeader(sources.ctx);
    }
    else {
        locale = configurations_1.DEFAULT_LANGUAGE;
    }
    return locale;
}
exports.findLocaleIn = findLocaleIn;
/**
 * Retrieves the language from the header parameters and if the language is not present returns the default.
 */
function getLocaleFromHeader(ctx) {
    var _a;
    if (ctx.header == null) {
        return configurations_1.DEFAULT_LANGUAGE;
    }
    return (_a = ctx.header["accept-language"]) !== null && _a !== void 0 ? _a : configurations_1.DEFAULT_LANGUAGE;
}
exports.getLocaleFromHeader = getLocaleFromHeader;
//# sourceMappingURL=i18n-tools.js.map