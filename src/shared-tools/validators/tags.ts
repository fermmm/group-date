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

/**
 * This Set contains the names of the tag props that will be saved encoded (currently using encodeURIComponent())) this is needed when
 * the content can be edited by users or other human sources because it may contain characters that breaks things like in the
 * format of the database backup files. Specifically line breaks or the \ character has problems.
 */
export const TAG_PROPS_TO_ENCODE = new Set<keyof Tag>(["name", "category", "language"]);

/**
 * If you added a prop that is an array or object add it here in order to be converted to JSON string when saving to the database
 */
export const TAG_PROPS_TO_STRINGIFY: Array<keyof Tag> = [];

export const TAG_PROPS_TO_ENCODE_AS_ARRAY = Array.from(TAG_PROPS_TO_ENCODE);

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
