import * as Validator from "fastest-validator";
import { ValidationRule } from "fastest-validator";
import { UserPropsValueTypes, User, ALL_GENDERS } from "../endpoints-interfaces/user";

// fastest-validator TS fix
const v = new (Validator as unknown as typeof Validator.default)();
type V = ValidationRule;

/**
 * This object contains the user props that will be shown at registration and also the validation restrictions.
 * Set all as optional = true in order to not generate an issue.
 * If a user prop needs to be validated when received but should not be showed at registration add it in the
 * OTHER_USER_PROPS_SCHEMA instead.
 */
const REGISTRATION_USER_PROPS_SCHEMA = {
   name: { type: "string", min: 2, max: 32, optional: true } as V,
   birthDate: { type: "number", optional: true } as V,
   isCoupleProfile: { type: "boolean", optional: true } as V,
   cityName: { type: "string", min: 2, max: 32, optional: true } as V,
   country: { type: "string", min: 2, max: 32, optional: true } as V,
   images: { type: "array", items: { type: "string", min: 1, max: 800 }, min: 0, max: 6, optional: true } as V,
   targetAgeMin: { type: "number", min: 18, max: 200, optional: true } as V,
   targetAgeMax: { type: "number", min: 18, max: 200, optional: true } as V,
   targetDistance: { type: "number", min: 25, max: 1200, optional: true } as V,
   dateIdea: { type: "string", min: 3, max: 300, optional: true } as V,
   profileDescription: { type: "string", max: 4000, optional: true } as V,
   locationLat: { type: "number", optional: true } as V,
   locationLon: { type: "number", optional: true } as V,
   height: { type: "number", min: 0, max: 300, optional: true } as V,
   sendNewUsersNotification: { type: "number", min: 0, max: 50, optional: true } as V,
   questionsShowed: { type: "array", items: { type: "string", min: 1, max: 20 }, max: 50, optional: true } as V,
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
 * These props list are not showed on registration and not required to finish registration
 */
const OTHER_USER_PROPS_SCHEMA = {
   notificationsToken: { type: "string", min: 0, max: 2000, optional: true } as V,
   language: { type: "string", min: 0, max: 100, optional: true } as V,
   isUnicornHunter: { type: "boolean", optional: true } as V,
   isUnicornHunterInsisting: { type: "boolean", optional: true } as V,
   unwantedUser: { type: "boolean", optional: true } as V,
};

/**
 * The only propuse of this line is to generate a TS error when the props of the schemas are not user props.
 * If you see a red underlie on the "test" (variable name) it meas there is a wrong property in the schema.
 */
const test: keyof User = "a" as EditableUserPropKey;

// Required user prop keys
export type RequiredUserPropKey = keyof typeof REGISTRATION_USER_PROPS_SCHEMA;

// All editable user props keys
export type EditableUserPropKey =
   | keyof typeof REGISTRATION_USER_PROPS_SCHEMA
   | keyof typeof OTHER_USER_PROPS_SCHEMA;

// The user object but only with the editable props
export type EditableUserProps = Partial<Record<EditableUserPropKey, UserPropsValueTypes>>;

// The editable props as string list
export const requiredUserPropsList: RequiredUserPropKey[] = Object.keys(
   REGISTRATION_USER_PROPS_SCHEMA,
) as RequiredUserPropKey[];

export const editableUserPropsList: EditableUserPropKey[] = Object.keys({
   ...REGISTRATION_USER_PROPS_SCHEMA,
   ...OTHER_USER_PROPS_SCHEMA,
}) as EditableUserPropKey[];

// Function to validate user props
export const validateUserProps = v.compile({
   ...REGISTRATION_USER_PROPS_SCHEMA,
   ...OTHER_USER_PROPS_SCHEMA,
});
