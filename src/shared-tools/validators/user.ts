import * as Validator from 'fastest-validator';
import { ValidationRule } from 'fastest-validator';
import { Gender, UserPropsValueTypes, User } from '../endpoints-interfaces/user';

// fastest-validator TS fix
const v = new ((Validator as unknown) as typeof Validator.default)();

/**
 * This object contains the user props required to finish registration and also the validation restrictions.
 * Set all as optional = true in order to not generate an issue.
 */
const EDITABLE_USER_PROPS_SCHEMA = {
   name: { type: 'string', min: 2, max: 32, optional: true },
   age: { type: 'number', min: 18, max: 120, optional: true },
   cityName: { type: 'string', min: 2, max: 32, optional: true },
   country: { type: 'string', min: 2, max: 32, optional: true },
   targetAgeMin: { type: 'number', min: 18, max: 120, optional: true },
   targetAgeMax: { type: 'number', min: 18, max: 120, optional: true },
   targetDistance: { type: 'number', min: 25, max: 150, optional: true },
   pictures: { type: 'array', items: 'url', min: 1, max: 6, optional: true },
   dateIdea: { type: 'string', min: 3, max: 100, optional: true },
   profileDescription: { type: 'string', max: 4000, optional: true },
   locationLat: { type: 'number', optional: true },
   locationLon: { type: 'number', optional: true },
   likesWoman: { type: 'boolean', optional: true },
   likesMan: { type: 'boolean', optional: true },
   likesWomanTrans: { type: 'boolean', optional: true },
   likesManTrans: { type: 'boolean', optional: true },
   likesOtherGenders: { type: 'boolean', optional: true },
   gender: { type: 'enum', values: Object.values(Gender), optional: true },
   height: { type: 'number', min: 100, max: 300, optional: true },
   sendNewUsersNotification: { type: 'number', min: 0, max: 50, optional: true },
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
const test: keyof User = 'a' as EditableUserPropKey;

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
