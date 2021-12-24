"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserProps = exports.editableUserPropsList = exports.requiredUserPropsList = void 0;
const Validator = require("fastest-validator");
const user_1 = require("../endpoints-interfaces/user");
// fastest-validator TS fix
const v = new Validator();
/**
 * This object contains the user props that will be shown at registration and also the validation restrictions.
 * Set all as optional = true in order to not generate an issue.
 * If a user prop needs to be validated when received but should not be showed at registration add it in the
 * OTHER_USER_PROPS_SCHEMA instead.
 */
const REGISTRATION_USER_PROPS_SCHEMA = {
    name: { type: "string", min: 2, max: 32, optional: true },
    birthDate: { type: "number", optional: true },
    isCoupleProfile: { type: "boolean", optional: true },
    cityName: { type: "string", min: 2, max: 32, optional: true },
    country: { type: "string", min: 2, max: 32, optional: true },
    images: { type: "array", items: { type: "string", min: 1, max: 800 }, min: 0, max: 6, optional: true },
    targetAgeMin: { type: "number", min: 18, max: 200, optional: true },
    targetAgeMax: { type: "number", min: 18, max: 200, optional: true },
    targetDistance: { type: "number", min: 25, max: 1200, optional: true },
    dateIdea: { type: "string", min: 3, max: 300, optional: true },
    profileDescription: { type: "string", max: 4000, optional: true },
    locationLat: { type: "number", optional: true },
    locationLon: { type: "number", optional: true },
    height: { type: "number", min: 0, max: 300, optional: true },
    sendNewUsersNotification: { type: "number", min: 0, max: 50, optional: true },
    questionsShowed: { type: "array", items: { type: "string", min: 1, max: 20 }, max: 50, optional: true },
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
 * These props list are not showed on registration and not required to finish registration
 */
const OTHER_USER_PROPS_SCHEMA = {
    notificationsToken: { type: "string", min: 0, max: 2000, optional: true },
    language: { type: "string", min: 0, max: 100, optional: true },
    isUnicornHunter: { type: "boolean", optional: true },
    isUnicornHunterInsisting: { type: "boolean", optional: true },
    unwantedUser: { type: "boolean", optional: true },
};
/**
 * The only propuse of this line is to generate a TS error when the props of the schemas are not user props.
 * If you see a red underlie on the "test" (variable name) it meas there is a wrong property in the schema.
 */
const test = "a";
// The editable props as string list
exports.requiredUserPropsList = Object.keys(REGISTRATION_USER_PROPS_SCHEMA);
exports.editableUserPropsList = Object.keys({
    ...REGISTRATION_USER_PROPS_SCHEMA,
    ...OTHER_USER_PROPS_SCHEMA,
});
// Function to validate user props
exports.validateUserProps = v.compile({
    ...REGISTRATION_USER_PROPS_SCHEMA,
    ...OTHER_USER_PROPS_SCHEMA,
});
//# sourceMappingURL=user.js.map