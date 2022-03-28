import * as Validator from "fastest-validator";
import { ValidationRule } from "fastest-validator";
import { Tag } from "../endpoints-interfaces/tags";

// fastest-validator TS fix
const v = new (Validator as unknown as typeof Validator.default)();
type V = ValidationRule;

/**
 * This object contains the tag props required to create them also the validation restrictions.
 */
const EDITABLE_TAG_PROPS_SCHEMA = {
   name: { type: "string", min: 2, max: 35, optional: false } as V,
   category: { type: "string", min: 2, max: 35, optional: false } as V,
   language: { type: "string", optional: true } as V,
   global: { type: "boolean", optional: true } as V,
};

// Export the same object casted with more type information
export const editableTagSchema = EDITABLE_TAG_PROPS_SCHEMA as Record<
   keyof typeof EDITABLE_TAG_PROPS_SCHEMA,
   ValidationRule
>;

/**
 * The only propuse of this line is to generate a typescript error when the props of the editableUserPropsSchema
 * does not match the props of the User object. They should always match.
 */
const test: keyof Tag = "a" as EditableTagPropKey;

// The editable props
export type EditableTagPropKey = keyof typeof EDITABLE_TAG_PROPS_SCHEMA;

// The editable props as string list
export const editableTagPropsList: EditableTagPropKey[] = Object.keys(
   EDITABLE_TAG_PROPS_SCHEMA,
) as EditableTagPropKey[];

// Function to validate tag props
export const validateTagProps = v.compile(EDITABLE_TAG_PROPS_SCHEMA);
