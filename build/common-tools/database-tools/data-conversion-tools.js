"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromQueryToSpecificPropValue = exports.fromQueryToSpecificProps = exports.serializeAllValuesIfNeeded = exports.serializeIfNeeded = exports.fromMapToObjectDeep = exports.fromGremlinMapToObject = void 0;
const database_manager_1 = require("./database-manager");
/**
 * Converts the format of the Gremlin Map output into JS object
 * @param serializedPropsToParse If a prop was serialized you need to include it here in order to be parsed
 */
function fromGremlinMapToObject(gremlinMap, serializedPropsToParse) {
    if (gremlinMap == null) {
        return null;
    }
    // Add general props
    const result = fromMapToObjectDeep(gremlinMap);
    serializedPropsToParse === null || serializedPropsToParse === void 0 ? void 0 : serializedPropsToParse.forEach(propName => {
        if (result[propName] != null) {
            result[propName] = JSON.parse(result[propName]);
        }
    });
    return result;
}
exports.fromGremlinMapToObject = fromGremlinMapToObject;
function fromMapToObjectDeep(map) {
    if (map instanceof Array) {
        return map.map(v => fromMapToObjectDeep(v));
    }
    if (!(map instanceof Map)) {
        return map;
    }
    const result = {};
    map.forEach((v, k) => {
        result[k] = fromMapToObjectDeep(v);
    });
    return result;
}
exports.fromMapToObjectDeep = fromMapToObjectDeep;
function serializeIfNeeded(value) {
    const type = typeof value;
    if (type !== "string" && type !== "boolean" && type !== "number") {
        return JSON.stringify(value);
    }
    return value;
}
exports.serializeIfNeeded = serializeIfNeeded;
function serializeAllValuesIfNeeded(object) {
    const result = {};
    Object.keys(object).forEach(key => {
        result[key] = serializeIfNeeded(object[key]);
    });
    return result;
}
exports.serializeAllValuesIfNeeded = serializeAllValuesIfNeeded;
/**
 * Takes a traversal that returns a single vertex or edge, extracts the desired props
 * from it and return them as a parsed object. Useful for optimization to not retrieve a full object from
 * the database.
 * You have to pass a type for the object returned, for example: if you want name and age of a user the
 * type is {name: string, age:number} or Pick<User, "name" | "age">
 *
 * @param serializedPropsToParse If there is any prop to extract that needs to be parsed add it here
 */
async function fromQueryToSpecificProps(query, propsToExtract, serializedPropsToParse) {
    var _a;
    return fromGremlinMapToObject((_a = (await (0, database_manager_1.sendQuery)(() => query
        .valueMap(...propsToExtract)
        .by(database_manager_1.__.unfold())
        .next()))) === null || _a === void 0 ? void 0 : _a.value, serializedPropsToParse);
}
exports.fromQueryToSpecificProps = fromQueryToSpecificProps;
/**
 * Takes a traversal that returns a single vertex or edge, extracts the value from a specified prop
 * and returns is parsed. Useful for optimization to not retrieve a full object from the database.
 * You have to pass a type for the object returned.
 */
async function fromQueryToSpecificPropValue(query, propToGetValue) {
    var _a;
    return (_a = (await (0, database_manager_1.sendQuery)(() => query.values(propToGetValue).next()))) === null || _a === void 0 ? void 0 : _a.value;
}
exports.fromQueryToSpecificPropValue = fromQueryToSpecificPropValue;
//# sourceMappingURL=data-conversion-tools.js.map