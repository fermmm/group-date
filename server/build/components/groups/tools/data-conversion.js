"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromQueryToGroupList = exports.fromQueryToGroup = void 0;
const database_manager_1 = require("../../../common-tools/database-tools/database-manager");
const security_tools_1 = require("../../../common-tools/security-tools/security-tools");
const queries_1 = require("../queries");
const data_conversion_tools_1 = require("../../../common-tools/database-tools/data-conversion-tools");
const data_conversion_1 = require("../../user/tools/data-conversion");
const group_1 = require("../../../shared-tools/validators/group");
/**
 * Converts a Gremlin query that returns a single group into a Group object.
 *
 * @param includeFullDetails Include or not the full group details: members, votes and matches relationships. Default = true
 */
async function fromQueryToGroup(queryOfGroup, protectPrivacy = true, includeFullDetails = true) {
    return fromGremlinMapToGroup((await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetGroupsInFinalFormat)(queryOfGroup, includeFullDetails).next())).value, protectPrivacy);
}
exports.fromQueryToGroup = fromQueryToGroup;
/**
 * Converts a gremlin query that should return a list of groups' vertices into a list of Group as object.
 * @param protectPrivacy If this group object is going to be sent to the client, this should be true.
 * @param includeFullDetails Include or not the full group details: members, votes and matches relationships. Default = true
 * @returns
 */
async function fromQueryToGroupList(queryOfGroups, protectPrivacy = true, includeFullDetails = true) {
    const resultGremlinOutput = (await (0, database_manager_1.sendQuery)(() => (0, queries_1.queryToGetGroupsInFinalFormat)(queryOfGroups, includeFullDetails).toList()));
    return resultGremlinOutput.map(groupFromQuery => {
        return fromGremlinMapToGroup(groupFromQuery, protectPrivacy);
    });
}
exports.fromQueryToGroupList = fromQueryToGroupList;
/**
 * Converts the format of the Gremlin Map output into a Group object
 */
function fromGremlinMapToGroup(groupFromDatabase, protectPrivacy = true) {
    if (groupFromDatabase == null) {
        return null;
    }
    // List of members is a list of users so we use the corresponding user converters for that part
    const members = groupFromDatabase.get("members");
    const membersConverted = members === null || members === void 0 ? void 0 : members.map(userFromQuery => {
        if (protectPrivacy) {
            return (0, security_tools_1.removePrivacySensitiveUserProps)((0, data_conversion_1.fromGremlinMapToUser)(userFromQuery));
        }
        return (0, data_conversion_1.fromGremlinMapToUser)(userFromQuery);
    });
    groupFromDatabase.delete("members");
    // Now the rest of the group properties can be converted
    const group = (0, data_conversion_tools_1.fromGremlinMapToObject)(groupFromDatabase, {
        serializedPropsToParse: group_1.GROUP_PROPS_TO_STRINGIFY,
        propsToDecode: group_1.GROUP_PROPS_TO_ENCODE_AS_ARRAY,
    });
    group.members = membersConverted;
    if (protectPrivacy) {
        return (0, security_tools_1.removePrivacySensitiveGroupProps)(group);
    }
    else {
        return group;
    }
}
//# sourceMappingURL=data-conversion.js.map