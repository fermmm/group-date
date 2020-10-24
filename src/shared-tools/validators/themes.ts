import * as Validator from 'fastest-validator';
import { ValidationRule } from 'fastest-validator';
import { Gender, UserPropsValueTypes, User } from '../endpoints-interfaces/user';
import { Theme } from '../endpoints-interfaces/themes';
import { GremlinValueType } from '../../common-tools/database-tools/gremlin-typing-tools';

// fastest-validator TS fix
const v = new ((Validator as unknown) as typeof Validator.default)();

/**
 * This object contains the theme props required to create them also the validation restrictions.
 */
const EDITABLE_THEME_PROPS_SCHEMA = {
   name: { type: 'string', min: 2, max: 300, optional: false },
   category: { type: 'string', min: 2, max: 300, optional: false },
   global: { type: 'boolean', optional: true },
};

// Export the same object casted with more type information
export const editableUserPropsSchema = EDITABLE_THEME_PROPS_SCHEMA as Record<
   keyof typeof EDITABLE_THEME_PROPS_SCHEMA,
   ValidationRule
>;

/**
 * The only propuse of this line is to generate a typescript error when the props of the editableUserPropsSchema
 * does not match the props of the User object. They should always match.
 */
const test: keyof Theme = 'a' as EditableThemePropKey;

// The editable props
export type EditableThemePropKey = keyof typeof EDITABLE_THEME_PROPS_SCHEMA;

// The theme object but only with the editable props
export type EditableThemeProps = Partial<Record<EditableThemePropKey, GremlinValueType>>;

// The editable props as string list
export const editableUserPropsList: EditableThemePropKey[] = Object.keys(
   EDITABLE_THEME_PROPS_SCHEMA,
) as EditableThemePropKey[];

// Function to validate theme props
export const validateThemeProps = v.compile(EDITABLE_THEME_PROPS_SCHEMA);
