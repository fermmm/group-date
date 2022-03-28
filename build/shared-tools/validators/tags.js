"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTagProps = exports.editableTagPropsList = exports.editableTagSchema = void 0;
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