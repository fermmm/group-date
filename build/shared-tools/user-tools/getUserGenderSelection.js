"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenderTagsTheUserDontBlock = exports.getGenderTagsTheUserHasBlocked = exports.getGenderTagsTheUserIsSubscribed = exports.getUserGenderSelection = void 0;
const user_1 = require("../endpoints-interfaces/user");
function getUserGenderSelection(user) {
    return {
        subscribed: getGenderTagsTheUserIsSubscribed(user),
        blocked: getGenderTagsTheUserHasBlocked(user),
        nonBlocked: getGenderTagsTheUserDontBlock(user),
    };
}
exports.getUserGenderSelection = getUserGenderSelection;
function getGenderTagsTheUserIsSubscribed(user) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = user === null || user === void 0 ? void 0 : user.tagsSubscribed) === null || _a === void 0 ? void 0 : _a.filter(tag => user_1.ALL_GENDERS.includes(tag.tagId))) === null || _b === void 0 ? void 0 : _b.map(tag => tag.tagId)) !== null && _c !== void 0 ? _c : []);
}
exports.getGenderTagsTheUserIsSubscribed = getGenderTagsTheUserIsSubscribed;
function getGenderTagsTheUserHasBlocked(user) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = user === null || user === void 0 ? void 0 : user.tagsBlocked) === null || _a === void 0 ? void 0 : _a.filter(tag => user_1.ALL_GENDERS.includes(tag.tagId))) === null || _b === void 0 ? void 0 : _b.map(tag => tag.tagId)) !== null && _c !== void 0 ? _c : []);
}
exports.getGenderTagsTheUserHasBlocked = getGenderTagsTheUserHasBlocked;
function getGenderTagsTheUserDontBlock(user) {
    return user_1.ALL_GENDERS.filter(gender => { var _a; return ((_a = user === null || user === void 0 ? void 0 : user.tagsBlocked) === null || _a === void 0 ? void 0 : _a.find(tag => tag.tagId === gender)) == null; });
}
exports.getGenderTagsTheUserDontBlock = getGenderTagsTheUserDontBlock;
//# sourceMappingURL=getUserGenderSelection.js.map