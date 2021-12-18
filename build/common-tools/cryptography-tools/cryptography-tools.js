"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = exports.compareHash = exports.createHash = void 0;
const Cryptr = require("cryptr");
const forge = require("node-forge");
const process_tools_1 = require("../process/process-tools");
const string_tools_1 = require("../string-tools/string-tools");
const cryptr = new Cryptr(process_tools_1.isProductionMode() ? string_tools_1.generateId() : "1234");
/**
 * Creates a hash based on the given string. The hash cannot be decoded back to the original string.
 */
function createHash(dataToEncrypt) {
    var md5 = forge.md.md5.create();
    md5.update(dataToEncrypt);
    return md5.digest().toHex();
}
exports.createHash = createHash;
/**
 * Compares the given string to the hash created using createHash(). Returns true if the strings match, false otherwise.
 */
function compareHash(notEncrypted, encrypted) {
    return createHash(notEncrypted) === encrypted;
}
exports.compareHash = compareHash;
/**
 * Encodes a string into a hash that can be decoded using decode(). For encoding and decoding a password is used.
 * The password is changed every time the server restarts, so after a restart the hash will not be valid. Use this
 * function for temporary transaction of credentials.
 * */
function encode(text) {
    return cryptr.encrypt(text);
}
exports.encode = encode;
/**
 * Decodes a hash that was encoded using encode(). For encoding and decoding a password is used.
 * The password is changed every time the server restarts, so after a restart the hash will not be valid. Use this
 * function for temporary transaction of credentials.
 * */
function decode(encryptedText) {
    return cryptr.decrypt(encryptedText);
}
exports.decode = decode;
//# sourceMappingURL=cryptography-tools.js.map