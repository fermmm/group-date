import * as Validator from "fastest-validator";
import { ValidationRule } from "fastest-validator";
import { UserPropsValueTypes, User, ALL_GENDERS } from "../endpoints-interfaces/user";

// fastest-validator TS fix
const v = new (Validator as unknown as typeof Validator.default)();
type V = ValidationRule;

/**
 * This object contains the user props that will be shown/required at registration and also the validation restrictions.
 * Set all as optional = true in order to not generate an issue.
 * If a user prop needs to be validated when received but is not required to have the profile completed add it in the
 * OTHER_USER_PROPS_SCHEMA instead.
 */
const REQUIRED_USER_PROPS_SCHEMA = {
   name: { type: "string", min: 2, max: 32, optional: true } as V,
   birthDate: { type: "number", optional: true } as V,
   cityName: { type: "string", min: 2, max: 32, optional: true } as V,
   images: { type: "array", items: { type: "string", min: 1, max: 800 }, min: 0, max: 6, optional: true } as V,
   targetAgeMin: { type: "number", min: 18, max: 200, optional: true } as V,
   targetAgeMax: { type: "number", min: 18, max: 200, optional: true } as V,
   targetDistance: { type: "number", min: 25, max: 1200, optional: true } as V,
   dateIdea: { type: "string", min: 3, max: 300, optional: true } as V,
   profileDescription: { type: "string", max: 4000, optional: true } as V,
   height: { type: "number", min: 0, max: 300, optional: true } as V,
   sendNewUsersNotification: { type: "number", min: 0, max: 50, optional: true } as V,
   genders: {
      type: "array",
      items: { type: "string", min: 1, max: 100 },
      max: ALL_GENDERS.length,
      optional: true,
   } as V,
   likesGenders: {
      type: "array",
      items: { type: "string", min: 1, max: 100 },
      max: ALL_GENDERS.length,
      optional: true,
   } as V,
};

/**
 * These props list are not showed on registration and not required to finish registration, may be required to enable
 * specific features or to have extra info about the user.
 */
const OTHER_USER_PROPS_SCHEMA = {
   locationLat: { type: "number", optional: true } as V,
   locationLon: { type: "number", optional: true } as V,
   notificationsToken: { type: "string", min: 0, max: 2000, optional: true } as V,
   language: { type: "string", min: 0, max: 100, optional: true } as V,
   isUnicornHunter: { type: "boolean", optional: true } as V,
   isUnicornHunterInsisting: { type: "boolean", optional: true } as V,
   unwantedUser: { type: "boolean", optional: true } as V,
   country: { type: "string", min: 2, max: 32, optional: true } as V,
};

/**
 * This Set contains the names of the user props that will be saved encoded (currently using encodeURI()) this is needed when
 * the content can be edited by users or other human sources because it may contain characters that breaks things like in the
 * format of the database backup files. Specifically line breaks or the \ character has problems.
 */
export const USER_PROPS_TO_ENCODE = new Set<keyof User>([
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
export const USER_PROPS_TO_STRINGIFY: Array<keyof User> = [
   "images",
   "notifications",
   "questionsResponded",
   "genders",
   "likesGenders",
   "banReasons",
   "requiredTasks",
];

export const USER_PROPS_TO_ENCODE_AS_ARRAY = Array.from(USER_PROPS_TO_ENCODE);

/**
 * The only propuse of this line is to generate a TS error when the props of the schemas are not user props.
 * If you see a red underlie on the "test" (variable name) it meas there is a wrong property in the schema.
 */
const test: keyof User = "a" as EditableUserPropKey;

// Required user prop keys
export type RequiredUserPropKey = keyof typeof REQUIRED_USER_PROPS_SCHEMA;

// All editable user props keys
export type EditableUserPropKey =
   | keyof typeof REQUIRED_USER_PROPS_SCHEMA
   | keyof typeof OTHER_USER_PROPS_SCHEMA;

// The user object but only with the editable props
export type EditableUserProps = Partial<Record<EditableUserPropKey, UserPropsValueTypes>>;

// The editable props as string list
export const requiredUserPropsList: RequiredUserPropKey[] = Object.keys(
   REQUIRED_USER_PROPS_SCHEMA,
) as RequiredUserPropKey[];

export const editableUserPropsList: EditableUserPropKey[] = Object.keys({
   ...REQUIRED_USER_PROPS_SCHEMA,
   ...OTHER_USER_PROPS_SCHEMA,
}) as EditableUserPropKey[];

export const editableUserPropListAsSet = new Set(editableUserPropsList);

// Function to validate user props
export const validateUserProps = v.compile({
   ...REQUIRED_USER_PROPS_SCHEMA,
   ...OTHER_USER_PROPS_SCHEMA,
});
