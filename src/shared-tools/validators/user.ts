import * as Validator from "fastest-validator";
import { ValidationRule } from "fastest-validator";
import { Gender, UserPropsValueTypes, User } from "../endpoints-interfaces/user";
import { APP_AUTHORED_THEMES_AS_QUESTIONS } from "../../configurations";

// fastest-validator TS fix
const v = new ((Validator as unknown) as typeof Validator.default)();
type V = ValidationRule;

/**
 * This object contains the user props required to finish registration and also the validation restrictions.
 * Set all as optional = true in order to not generate an issue.
 */
const EDITABLE_USER_PROPS_SCHEMA = {
   name: { type: "string", min: 2, max: 32, optional: true } as V,
   age: { type: "number", min: 18, max: 120, optional: true } as V,
   isCoupleProfile: { type: "boolean", optional: true } as V,
   cityName: { type: "string", min: 2, max: 32, optional: true } as V,
   country: { type: "string", min: 2, max: 32, optional: true } as V,
   targetAgeMin: { type: "number", min: 18, max: 120, optional: true } as V,
   targetAgeMax: { type: "number", min: 18, max: 120, optional: true } as V,
   targetDistance: { type: "number", min: 25, max: 150, optional: true } as V,
   images: { type: "array", items: "url", min: 1, max: 6, optional: true } as V,
   dateIdea: { type: "string", min: 3, max: 100, optional: true } as V,
   profileDescription: { type: "string", max: 4000, optional: true } as V,
   locationLat: { type: "number", optional: true } as V,
   locationLon: { type: "number", optional: true } as V,
   likesWoman: { type: "boolean", optional: true } as V,
   likesMan: { type: "boolean", optional: true } as V,
   likesWomanTrans: { type: "boolean", optional: true } as V,
   likesManTrans: { type: "boolean", optional: true } as V,
   likesOtherGenders: { type: "boolean", optional: true } as V,
   gender: { type: "enum", values: Object.values(Gender), optional: true } as V,
   height: { type: "number", min: 100, max: 300, optional: true } as V,
   sendNewUsersNotification: { type: "number", min: 0, max: 50, optional: true } as V,
   questionsShowed: {
      type: "array",
      items: {
         type: "number",
         enum: APP_AUTHORED_THEMES_AS_QUESTIONS.map(q => q.questionId),
      },
      max: APP_AUTHORED_THEMES_AS_QUESTIONS.length,
      optional: true,
   } as V,
};

// Export the same object casted with more type information
export const editableUserPropsSchema = EDITABLE_USER_PROPS_SCHEMA as Record<
   keyof typeof EDITABLE_USER_PROPS_SCHEMA,
   ValidationRule
>;

/**
 * The only propuse of this line is to generate a typescript error when the props of the editableUserPropsSchema
 * does not match the props of the User object. They should always match.
 */
const test: keyof User = "a" as EditableUserPropKey;

// The editable props
export type EditableUserPropKey = keyof typeof EDITABLE_USER_PROPS_SCHEMA;

// The user object but only with the editable props
export type EditableUserProps = Partial<Record<EditableUserPropKey, UserPropsValueTypes>>;

// The editable props as string list
export const editableUserPropsList: EditableUserPropKey[] = Object.keys(
   EDITABLE_USER_PROPS_SCHEMA,
) as EditableUserPropKey[];

// Function to validate user props
export const validateUserProps = v.compile(EDITABLE_USER_PROPS_SCHEMA);
