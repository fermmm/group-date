"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromQueryToGroupsReceivingNewUsers = exports.fromQueryToGroupCandidates = void 0;
const data_conversion_tools_1 = require("../../../common-tools/database-tools/data-conversion-tools");
const string_tools_1 = require("../../../common-tools/string-tools/string-tools");
const group_candidate_analysis_1 = require("./group-candidate-analysis");
/**
 * Converts a gremlin query that should return a list of group candidates (groups of users) into the corresponding serialized objects.
 */
async function fromQueryToGroupCandidates(query) {
    const resultGremlinOutput = (await query.toList());
    const result = resultGremlinOutput.map(groupAsMap => {
        return { groupId: string_tools_1.generateId(), users: groupAsMap.map(g => data_conversion_tools_1.fromGremlinMapToObject(g)) };
    });
    group_candidate_analysis_1.reportPossibleDataCorruption(result);
    return result;
}
exports.fromQueryToGroupCandidates = fromQueryToGroupCandidates;
/**
 * Converts into a serializer object a gremlin query that returns groups that can receive new users
 */
async function fromQueryToGroupsReceivingNewUsers(query) {
    const resultGremlinOutput = (await query.toList());
    return resultGremlinOutput.map(r => data_conversion_tools_1.fromGremlinMapToObject(r));
}
exports.fromQueryToGroupsReceivingNewUsers = fromQueryToGroupsReceivingNewUsers;
//# sourceMappingURL=data-conversion.js.map