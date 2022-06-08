import * as Validator from "fastest-validator";
import { ValidationRule } from "fastest-validator";
import { Group } from "../endpoints-interfaces/groups";

// fastest-validator TS fix
const v = new (Validator as unknown as typeof Validator.default)();
type V = ValidationRule;

/**
 * This object contains the group props that can be edited with the validation restrictions.
 */
const EDITABLE_GROUP_PROPS_SCHEMA = {
   // Currently there is no group prop that is edited on endpoints.
};

/**
 * This Set contains the names of the group props that will be saved encoded (currently using encodeURI()) this is needed when
 * the content can be edited by users or other human sources because it may contain characters that breaks things like in the
 * format of the database backup files. Specifically line breaks or the \ character has problems.
 */
export const GROUP_PROPS_TO_ENCODE = new Set<keyof Group>(["name", "chat", "mostVotedIdea"]);

/**
 * If you added a prop that is an array or object add it here in order to be converted to JSON string when saving to the database
 */
export const GROUP_PROPS_TO_STRINGIFY: Array<keyof Group> = ["chat", "dayOptions", "seenBy"];

export const GROUP_PROPS_TO_ENCODE_AS_ARRAY = Array.from(GROUP_PROPS_TO_ENCODE);

// Export the same object casted with more type information
export const editableGroupSchema = EDITABLE_GROUP_PROPS_SCHEMA as Record<
   keyof typeof EDITABLE_GROUP_PROPS_SCHEMA,
   ValidationRule
>;

/**
 * The only propuse of this line is to generate a typescript error when the props of the editableUserPropsSchema
 * does not match the props of the User object. They should always match.
 */
const test: keyof Group = "a" as EditableGroupPropKey;

// The editable props
export type EditableGroupPropKey = keyof typeof EDITABLE_GROUP_PROPS_SCHEMA;

// The editable props as string list
export const editableGroupPropsList: EditableGroupPropKey[] = Object.keys(
   EDITABLE_GROUP_PROPS_SCHEMA,
) as EditableGroupPropKey[];

// Function to validate group props
export const validateGroupProps = v.compile(EDITABLE_GROUP_PROPS_SCHEMA);
