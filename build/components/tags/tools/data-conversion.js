"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromGremlinMapToTag = exports.fromQueryToTagList = exports.fromQueryToTag = void 0;
const common_queries_1 = require("../../../common-tools/database-tools/common-queries");
const data_conversion_tools_1 = require("../../../common-tools/database-tools/data-conversion-tools");
const database_manager_1 = require("../../../common-tools/database-tools/database-manager");
/**
 * Converts into a Tag object a gremlin query that should return a single tag vertex.
 */
async function fromQueryToTag(queryOfTag) {
    queryOfTag = (0, common_queries_1.valueMap)(queryOfTag);
    return fromGremlinMapToTag((await (0, database_manager_1.sendQuery)(() => queryOfTag.next())).value);
}
exports.fromQueryToTag = fromQueryToTag;
/**
 * Converts a gremlin query that should return a list of tags' vertices into a list of Tag objects.
 */
async function fromQueryToTagList(queryOfTags) {
    queryOfTags = (0, common_queries_1.valueMap)(queryOfTags);
    const resultGremlinOutput = (await (0, database_manager_1.sendQuery)(() => queryOfTags.toList()));
    return resultGremlinOutput.map(tagFromQuery => {
        return fromGremlinMapToTag(tagFromQuery);
    });
}
exports.fromQueryToTagList = fromQueryToTagList;
/**
 * Converts the format of the Gremlin Map output into a Tag object
 */
function fromGremlinMapToTag(tagFromDatabase) {
    if (tagFromDatabase == null) {
        return null;
    }
    return (0, data_conversion_tools_1.fromGremlinMapToObject)(tagFromDatabase);
}
exports.fromGremlinMapToTag = fromGremlinMapToTag;
//# sourceMappingURL=data-conversion.js.map