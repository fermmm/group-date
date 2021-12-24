"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromQueryToCardsResult = void 0;
const database_manager_1 = require("../../../common-tools/database-tools/database-manager");
const security_tools_1 = require("../../../common-tools/security-tools/security-tools");
const data_conversion_1 = require("../../user/tools/data-conversion");
async function fromQueryToCardsResult(traversal) {
    const queryMap = (await (0, database_manager_1.sendQuery)(() => traversal.next())).value;
    return {
        liking: queryMap
            .get("liking")
            .map(userFromQuery => (0, security_tools_1.removePrivacySensitiveUserProps)((0, data_conversion_1.fromGremlinMapToUser)(userFromQuery))),
        others: queryMap
            .get("others")
            .map(userFromQuery => (0, security_tools_1.removePrivacySensitiveUserProps)((0, data_conversion_1.fromGremlinMapToUser)(userFromQuery))),
    };
}
exports.fromQueryToCardsResult = fromQueryToCardsResult;
//# sourceMappingURL=data-conversion.js.map