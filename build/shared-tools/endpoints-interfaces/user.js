"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportUserType = exports.NotificationChannelId = exports.allMatchTypes = exports.allAttractionTypes = exports.NotificationType = exports.MatchType = exports.AttractionType = exports.NON_CIS_GENDERS = exports.TRANS_GENDERS = exports.CIS_GENDERS = exports.ALL_GENDERS = exports.Gender = void 0;
/**
 * The order here in this enum determines the order the genders will appear in some places
 */
var Gender;
(function (Gender) {
    Gender["Woman"] = "Woman";
    Gender["Man"] = "Man";
    Gender["Agender"] = "Agender";
    Gender["Androgynous"] = "Androgynous";
    Gender["Bigender"] = "Bigender";
    Gender["Genderfluid"] = "Genderfluid";
    Gender["Genderqueer"] = "Genderqueer";
    Gender["GenderNonConforming"] = "Gender Nonconforming";
    Gender["Hijra"] = "Hijra";
    Gender["Intersex"] = "Intersex";
    Gender["NonBinary"] = "Non binary";
    Gender["Other"] = "Other";
    Gender["Pangender"] = "Pangender";
    Gender["TransgenderWoman"] = "Transgender Woman";
    Gender["TransgenderMan"] = "Transgender Man";
})(Gender = exports.Gender || (exports.Gender = {}));
exports.ALL_GENDERS = Object.values(Gender);
exports.CIS_GENDERS = [Gender.Woman, Gender.Man];
exports.TRANS_GENDERS = [Gender.TransgenderWoman, Gender.TransgenderMan];
exports.NON_CIS_GENDERS = exports.ALL_GENDERS.filter(gender => !exports.CIS_GENDERS.includes(gender));
var AttractionType;
(function (AttractionType) {
    AttractionType["Like"] = "Like";
    AttractionType["Dislike"] = "Dislike";
})(AttractionType = exports.AttractionType || (exports.AttractionType = {}));
var MatchType;
(function (MatchType) {
    MatchType["Like"] = "Match";
    MatchType["Dislike"] = "SeenMatch";
})(MatchType = exports.MatchType || (exports.MatchType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["TextOnly"] = 0] = "TextOnly";
    NotificationType[NotificationType["Group"] = 1] = "Group";
    NotificationType[NotificationType["Chat"] = 2] = "Chat";
    NotificationType[NotificationType["ContactChat"] = 3] = "ContactChat";
    NotificationType[NotificationType["NearbyPartyOrEvent"] = 4] = "NearbyPartyOrEvent";
    NotificationType[NotificationType["CardsGame"] = 5] = "CardsGame";
    NotificationType[NotificationType["About"] = 6] = "About";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
exports.allAttractionTypes = Object.values(AttractionType);
exports.allMatchTypes = Object.values(MatchType);
var NotificationChannelId;
(function (NotificationChannelId) {
    NotificationChannelId["Default"] = "default";
    NotificationChannelId["ChatMessages"] = "chat";
    NotificationChannelId["Events"] = "events";
    NotificationChannelId["NewUsers"] = "newUsers";
    NotificationChannelId["DateReminders"] = "dateReminders";
})(NotificationChannelId = exports.NotificationChannelId || (exports.NotificationChannelId = {}));
var ReportUserType;
(function (ReportUserType) {
    ReportUserType["NonEthical"] = "non-ethical";
    ReportUserType["MissingPicture"] = "missing-picture";
})(ReportUserType = exports.ReportUserType || (exports.ReportUserType = {}));
//# sourceMappingURL=user.js.map