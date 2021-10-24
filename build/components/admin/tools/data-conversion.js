"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromQueryToChatWithAdminsList = exports.fromQueryToChatWithAdmins = void 0;
const data_conversion_tools_1 = require("../../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../../common-tools/database-tools/database-manager");
const security_tools_1 = require("../../../common-tools/security-tools/security-tools");
const data_conversion_1 = require("../../user/tools/data-conversion");
/**
 * Converts into a Group object a gremlin query that should return a single group vertex.
 */
async function fromQueryToChatWithAdmins(query, protectPrivacy = true) {
    return fromGremlinMapToChatWithAdmins((await (0, database_manager_1.sendQuery)(() => query.next())).value, protectPrivacy);
}
exports.fromQueryToChatWithAdmins = fromQueryToChatWithAdmins;
/**
 * Converts a gremlin query that should return a list of groups' vertices into a list of Group as object.
 */
async function fromQueryToChatWithAdminsList(query, protectPrivacy = true) {
    const resultGremlinOutput = (await (0, database_manager_1.sendQuery)(() => query.toList()));
    return resultGremlinOutput.map(queryElement => {
        return fromGremlinMapToChatWithAdmins(queryElement, protectPrivacy);
    });
}
exports.fromQueryToChatWithAdminsList = fromQueryToChatWithAdminsList;
/**
 * Converts the format of the Gremlin Map output into a ChatWithAdmins object
 */
function fromGremlinMapToChatWithAdmins(chatWithAdmins, protectPrivacy = true) {
    if (chatWithAdmins == null) {
        return null;
    }
    // Convert user prop with the corresponding converter for the users
    let nonAdminUser = (0, data_conversion_1.fromGremlinMapToUser)(chatWithAdmins.get("nonAdminUser"));
    chatWithAdmins.delete("nonAdminUser");
    if (nonAdminUser != null && protectPrivacy) {
        nonAdminUser = (0, security_tools_1.removePrivacySensitiveUserProps)(nonAdminUser);
    }
    // Now the rest of the properties can be converted
    const result = (0, data_conversion_tools_1.fromGremlinMapToObject)(chatWithAdmins, ["messages"]);
    result.nonAdminUser = nonAdminUser;
    return result;
}
//# sourceMappingURL=data-conversion.js.map