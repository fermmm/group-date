"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTagProps = exports.editableTagPropsList = exports.editableTagSchema = exports.TAG_PROPS_TO_ENCODE_AS_ARRAY = exports.TAG_PROPS_TO_ENCODE = exports.TAG_PROPS_TO_STRINGIFY = void 0;
const Validator = require("fastest-validator");
// fastest-validator TS fix
const v = new Validator();
/**
 * This object contains the tag props required to create them also the validation restrictions.
 */
const EDITABLE_TAG_PROPS_SCHEMA = {
    name: { type: "string", min: 2, max: 35, optional: false },
    category: { type: "string", min: 2, max: 35, optional: false },
    language: { type: "string", optional: true },
    global: { type: "boolean", optional: true },
};
/**
 * If you added a prop that is an array or object add it here in order to be converted to JSON string when saving to the database
 */
exports.TAG_PROPS_TO_STRINGIFY = [];
/**
 * This Set contains the names of the tag props that will be saved encoded (currently using encodeURIComponent())) this is needed when
 * the content can be edited by users or other human sources because it may contain characters that breaks things like in the
 * format of the database backup files. Specifically line breaks or the \ character has problems.
 * Props that are stringified should also be encoded, that is why we add the other array into this one.
 */
exports.TAG_PROPS_TO_ENCODE = new Set([
    ...exports.TAG_PROPS_TO_STRINGIFY,
    "name",
    "category",
    "language",
]);
exports.TAG_PROPS_TO_ENCODE_AS_ARRAY = Array.from(exports.TAG_PROPS_TO_ENCODE);
// Export the same object casted with more type information
exports.editableTagSchema = EDITABLE_TAG_PROPS_SCHEMA;
/**
 * The only propuse of this line is to generate a typescript error when the props of the editableUserPropsSchema
 * does not match the props of the User object. They should always match.
 */
const test = "a";
// The editable props as string list
exports.editableTagPropsList = Object.keys(EDITABLE_TAG_PROPS_SCHEMA);
// Function to validate tag props
exports.validateTagProps = v.compile(EDITABLE_TAG_PROPS_SCHEMA);
//# sourceMappingURL=tags.js.map