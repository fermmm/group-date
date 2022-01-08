"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBanReason = exports.DatabaseContentFileFormat = void 0;
var DatabaseContentFileFormat;
(function (DatabaseContentFileFormat) {
    DatabaseContentFileFormat[DatabaseContentFileFormat["NeptuneCsv"] = 0] = "NeptuneCsv";
    DatabaseContentFileFormat[DatabaseContentFileFormat["GraphMl"] = 1] = "GraphMl";
    DatabaseContentFileFormat[DatabaseContentFileFormat["GremlinQuery"] = 2] = "GremlinQuery";
})(DatabaseContentFileFormat = exports.DatabaseContentFileFormat || (exports.DatabaseContentFileFormat = {}));
var UserBanReason;
(function (UserBanReason) {
    UserBanReason["Spam"] = "User is doing spam";
    UserBanReason["UnsupportedUsageIntention"] = "User wants to use the app with a not supported intention";
    UserBanReason["NotInterestedInTheApp"] = "User showed no interest about participating in what the app proposes but created a profile anyway";
    UserBanReason["NonEthicalUsage"] = "User is doing non-ethical usage of the app";
    UserBanReason["BanRequestedByAuthority"] = "Google or Apple requested the user to be banned";
    UserBanReason["BadQualityProfile"] = "The profile lacks basic information like a useful image. Profile quality is too bad.";
})(UserBanReason = exports.UserBanReason || (exports.UserBanReason = {}));
//# sourceMappingURL=admin.js.map