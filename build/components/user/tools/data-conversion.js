"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromGremlinMapToUser = exports.fromQueryToUserList = exports.fromQueryToUser = void 0;
const common_queries_1 = require("../../../common-tools/database-tools/common-queries");
const data_conversion_tools_1 = require("../../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../../common-tools/database-tools/database-manager");
const security_tools_1 = require("../../../common-tools/security-tools/security-tools");
const user_1 = require("../../../shared-tools/validators/user");
const queries_1 = require("../queries");
/**
 * Converts into a User object a gremlin query that should return a single user vertex.
 * @param includeFullInfo Includes tags data
 */
async function fromQueryToUser(queryOfUser, includeFullInfo) {
    if (includeFullInfo) {
        queryOfUser = (0, queries_1.queryToIncludeFullInfoInUserQuery)(queryOfUser);
    }
    else {
        queryOfUser = (0, common_queries_1.valueMap)(queryOfUser);
    }
    return fromGremlinMapToUser((await (0, database_manager_1.sendQuery)(() => queryOfUser.next())).value);
}
exports.fromQueryToUser = fromQueryToUser;
/**
 * Converts a gremlin query that should return a list of users' vertices into a list of Users as object.
 *
 * @param protectPrivacy Don't include internal properties like token and other credentials. default = true
 * @param includeFullInfo default = true Includes questions and tags data
 */
async function fromQueryToUserList(queryOfUsers, protectPrivacy = true, includeFullInfo = true) {
    if (includeFullInfo) {
        queryOfUsers = (0, queries_1.queryToIncludeFullInfoInUserQuery)(queryOfUsers);
    }
    else {
        queryOfUsers = (0, common_queries_1.valueMap)(queryOfUsers);
    }
    const resultGremlinOutput = (await (0, database_manager_1.sendQuery)(() => queryOfUsers.toList()));
    return resultGremlinOutput.map(userFromQuery => {
        if (protectPrivacy) {
            return (0, security_tools_1.removePrivacySensitiveUserProps)(fromGremlinMapToUser(userFromQuery));
        }
        return fromGremlinMapToUser(userFromQuery);
    });
}
exports.fromQueryToUserList = fromQueryToUserList;
/**
 * Converts the format of the Gremlin Map output into a User object
 */
function fromGremlinMapToUser(userFromDatabase) {
    if (userFromDatabase == null) {
        return null;
    }
    const result = (0, data_conversion_tools_1.fromGremlinMapToObject)(userFromDatabase, {
        serializedPropsToParse: user_1.USER_PROPS_TO_STRINGIFY,
        propsToDecode: user_1.USER_PROPS_TO_ENCODE_AS_ARRAY,
    });
    return result;
}
exports.fromGremlinMapToUser = fromGremlinMapToUser;
//# sourceMappingURL=data-conversion.js.map