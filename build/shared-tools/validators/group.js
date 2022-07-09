"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGroupProps = exports.editableGroupPropsList = exports.editableGroupSchema = exports.GROUP_PROPS_TO_ENCODE_AS_ARRAY = exports.GROUP_PROPS_TO_STRINGIFY = exports.GROUP_PROPS_TO_ENCODE = void 0;
const Validator = require("fastest-validator");
// fastest-validator TS fix
const v = new Validator();
/**
 * This object contains the group props that can be edited with the validation restrictions.
 */
const EDITABLE_GROUP_PROPS_SCHEMA = {
// Currently there is no group prop that is edited on endpoints.
};
/**
 * This Set contains the names of the group props that will be saved encoded (currently using encodeURIComponent()) this is needed when
 * the content can be edited by users or other human sources because it may contain characters that breaks things like in the
 * format of the database backup files. Specifically line breaks or the \ character has problems.
 */
exports.GROUP_PROPS_TO_ENCODE = new Set(["name", "chat", "mostVotedIdea"]);
/**
 * If you added a prop that is an array or object add it here in order to be converted to JSON string when saving to the database
 */
exports.GROUP_PROPS_TO_STRINGIFY = ["chat", "dayOptions", "seenBy"];
exports.GROUP_PROPS_TO_ENCODE_AS_ARRAY = Array.from(exports.GROUP_PROPS_TO_ENCODE);
// Export the same object casted with more type information
exports.editableGroupSchema = EDITABLE_GROUP_PROPS_SCHEMA;
/**
 * The only propuse of this line is to generate a typescript error when the props of the editableUserPropsSchema
 * does not match the props of the User object. They should always match.
 */
const test = "a";
// The editable props as string list
exports.editableGroupPropsList = Object.keys(EDITABLE_GROUP_PROPS_SCHEMA);
// Function to validate group props
exports.validateGroupProps = v.compile(EDITABLE_GROUP_PROPS_SCHEMA);
//# sourceMappingURL=group.js.map