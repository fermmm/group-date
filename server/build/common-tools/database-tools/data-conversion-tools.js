"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromQueryToSpecificPropValue = exports.fromQueryToSpecificProps = exports.encodeIfNeeded = exports.serializeAllValuesIfNeeded = exports.serializeIfNeeded = exports.fromMapToObjectDeep = exports.fromGremlinMapToObject = void 0;
const decodeString_1 = require("../../shared-tools/utility-functions/decodeString");
const encodeString_1 = require("../../shared-tools/utility-functions/encodeString");
const group_1 = require("../../shared-tools/validators/group");
const tags_1 = require("../../shared-tools/validators/tags");
const user_1 = require("../../shared-tools/validators/user");
const database_manager_1 = require("./database-manager");
/**
 * Converts the format of the Gremlin Map output into JS object
 * @param options If a prop was serialized or parsed you need to include it here in order to be restored
 */
function fromGremlinMapToObject(gremlinMap, options) {
    const { serializedPropsToParse, propsToDecode } = options !== null && options !== void 0 ? options : {};
    if (gremlinMap == null) {
        return null;
    }
    // Add general props
    const result = fromMapToObjectDeep(gremlinMap);
    propsToDecode === null || propsToDecode === void 0 ? void 0 : propsToDecode.forEach(propName => {
        if (result[propName] != null) {
            result[propName] = (0, decodeString_1.decodeString)(result[propName]);
        }
    });
    serializedPropsToParse === null || serializedPropsToParse === void 0 ? void 0 : serializedPropsToParse.forEach(propName => {
        if (result[propName] != null) {
            try {
                result[propName] = JSON.parse(result[propName]);
            }
            catch (e) {
                // This can potentially happen when the data is corrupted on the database
                // console.log(
                //    "Failed to parse JSON prop in fromGremlinMapToObject function.",
                //    "Prop name:",
                //    propName,
                //    "Prop value:",
                //    result[propName],
                //    "Type:",
                //    typeof result[propName],
                //    "All props:",
                //    result,
                // );
                delete result[propName];
            }
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
    if (type === "string" || type === "number" || type === "boolean") {
        return value;
    }
    return JSON.stringify(value);
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
function encodeIfNeeded(value, valueName, vertex) {
    const type = typeof value;
    // Here we are only continuing with string values but typescript does not realize, that is why typescript needs to be disabled later
    if (type !== "string") {
        return value;
    }
    if (vertex === "user") {
        if (user_1.USER_PROPS_TO_ENCODE.has(valueName)) {
            //@ts-ignore
            return (0, encodeString_1.encodeString)(value);
        }
        else {
            return value;
        }
    }
    if (vertex === "tag") {
        if (tags_1.TAG_PROPS_TO_ENCODE.has(valueName)) {
            //@ts-ignore
            return (0, encodeString_1.encodeString)(value);
        }
        else {
            return value;
        }
    }
    if (vertex === "group") {
        if (group_1.GROUP_PROPS_TO_ENCODE.has(valueName)) {
            //@ts-ignore
            return (0, encodeString_1.encodeString)(value);
        }
        else {
            return value;
        }
    }
    return value;
}
exports.encodeIfNeeded = encodeIfNeeded;
/**
 * Takes a traversal that returns a single vertex or edge, extracts the desired props
 * from it and return them as a parsed object. Useful for optimization to not retrieve a full object from
 * the database.
 * You have to pass a type for the object returned, for example: if you want name and age of a user the
 * type is {name: string, age:number} or Pick<User, "name" | "age">
 *
 * @param options If there is any prop to decode from string or to parse use this options object
 */
async function fromQueryToSpecificProps(query, propsToExtract, options) {
    var _a;
    return fromGremlinMapToObject((_a = (await (0, database_manager_1.sendQuery)(() => query
        .valueMap(...propsToExtract)
        .by(database_manager_1.__.unfold())
        .next()))) === null || _a === void 0 ? void 0 : _a.value, options);
}
exports.fromQueryToSpecificProps = fromQueryToSpecificProps;
/**
 * Takes a traversal that returns a single vertex or edge, extracts the value from a specified prop
 * and returns is parsed. Useful for optimization to not retrieve a full object from the database.
 * You have to pass a type for the object returned.
 */
async function fromQueryToSpecificPropValue(query, propToGetValue, settings) {
    var _a;
    const { needsDecoding, needsParsing } = settings !== null && settings !== void 0 ? settings : {};
    let result = (_a = (await (0, database_manager_1.sendQuery)(() => query.values(propToGetValue).next()))) === null || _a === void 0 ? void 0 : _a.value;
    if (typeof result === "string" && needsDecoding) {
        result = (0, decodeString_1.decodeString)(result);
    }
    if (typeof result === "string" && needsParsing) {
        try {
            result = JSON.parse(result);
        }
        catch (e) { }
    }
    return result;
}
exports.fromQueryToSpecificPropValue = fromQueryToSpecificPropValue;
//# sourceMappingURL=data-conversion-tools.js.map