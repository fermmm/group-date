"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserProps = exports.editableUserPropListAsSet = exports.editableUserPropsList = exports.requiredUserPropsList = exports.USER_PROPS_TO_ENCODE_AS_ARRAY = exports.USER_PROPS_TO_STRINGIFY = exports.USER_PROPS_TO_ENCODE = void 0;
const Validator = require("fastest-validator");
const user_1 = require("../endpoints-interfaces/user");
// fastest-validator TS fix
const v = new Validator();
/**
 * This object contains the user props that will be shown/required at registration and also the validation restrictions.
 * Set all as optional = true in order to not generate an issue.
 * If a user prop needs to be validated when received but is not required to have the profile completed add it in the
 * OTHER_USER_PROPS_SCHEMA instead.
 */
const REQUIRED_USER_PROPS_SCHEMA = {
    name: { type: "string", min: 2, max: 32, optional: true },
    birthDate: { type: "number", optional: true },
    cityName: { type: "string", min: 2, max: 32, optional: true },
    images: { type: "array", items: { type: "string", min: 1, max: 800 }, min: 0, max: 6, optional: true },
    targetAgeMin: { type: "number", min: 18, max: 200, optional: true },
    targetAgeMax: { type: "number", min: 18, max: 200, optional: true },
    targetDistance: { type: "number", min: 25, max: 1200, optional: true },
    dateIdea: { type: "string", min: 3, max: 300, optional: true },
    profileDescription: { type: "string", max: 4000, optional: true },
    height: { type: "number", min: 0, max: 300, optional: true },
    sendNewUsersNotification: { type: "number", min: 0, max: 50, optional: true },
    genders: {
        type: "array",
        items: { type: "string", min: 1, max: 100 },
        max: user_1.ALL_GENDERS.length,
        optional: true,
    },
    likesGenders: {
        type: "array",
        items: { type: "string", min: 1, max: 100 },
        max: user_1.ALL_GENDERS.length,
        optional: true,
    },
};
/**
 * These props list are not showed on registration and not required to finish registration, may be required to enable
 * specific features or to have extra info about the user.
 */
const OTHER_USER_PROPS_SCHEMA = {
    locationLat: { type: "number", optional: true },
    locationLon: { type: "number", optional: true },
    notificationsToken: { type: "string", min: 0, max: 2000, optional: true },
    language: { type: "string", min: 0, max: 100, optional: true },
    isUnicornHunter: { type: "boolean", optional: true },
    isUnicornHunterInsisting: { type: "boolean", optional: true },
    unwantedUser: { type: "boolean", optional: true },
    country: { type: "string", min: 2, max: 32, optional: true },
};
/**
 * This Set contains the names of the user props that will be saved encoded (currently using encodeURIComponent()) this is needed when
 * the content can be edited by users or other human sources because it may contain characters that breaks things like in the
 * format of the database backup files. Specifically line breaks or the \ character has problems.
 */
exports.USER_PROPS_TO_ENCODE = new Set([
    "profileDescription",
    "name",
    "cityName",
    "dateIdea",
    "country",
    "language",
    "images",
    "questionsResponded",
    "notificationsToken",
    "genders",
    "likesGenders",
]);
/**
 * If you added a prop that is an array or object add it here in order to be converted to JSON string when saving to the database
 */
exports.USER_PROPS_TO_STRINGIFY = [
    "images",
    "notifications",
    "questionsResponded",
    "genders",
    "likesGenders",
    "banReasons",
    "requiredTasks",
];
exports.USER_PROPS_TO_ENCODE_AS_ARRAY = Array.from(exports.USER_PROPS_TO_ENCODE);
/**
 * The only propuse of this line is to generate a TS error when the props of the schemas are not user props.
 * If you see a red underlie on the "test" (variable name) it meas there is a wrong property in the schema.
 */
const test = "a";
// The editable props as string list
exports.requiredUserPropsList = Object.keys(REQUIRED_USER_PROPS_SCHEMA);
exports.editableUserPropsList = Object.keys({
    ...REQUIRED_USER_PROPS_SCHEMA,
    ...OTHER_USER_PROPS_SCHEMA,
});
exports.editableUserPropListAsSet = new Set(exports.editableUserPropsList);
// Function to validate user props
exports.validateUserProps = v.compile({
    ...REQUIRED_USER_PROPS_SCHEMA,
    ...OTHER_USER_PROPS_SCHEMA,
});
//# sourceMappingURL=user.js.map