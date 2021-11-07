"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = exports.compareEncryption = exports.encrypt = void 0;
const bcrypt = require("bcrypt");
const Cryptr = require("cryptr");
const process_tools_1 = require("../process/process-tools");
const string_tools_1 = require("../string-tools/string-tools");
const cryptr = new Cryptr((0, process_tools_1.isProductionMode)() ? (0, string_tools_1.generateId)() : "1234");
/**
 * Creates a hash based on the given string. The hash cannot be decoded back to the original string.
 */
async function encrypt(dataToEncrypt) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            reject(err);
            return;
        }
        bcrypt.hash(dataToEncrypt, salt, (err2, hash) => {
            if (err2) {
                reject(err2);
                return;
            }
            resolve(hash);
        });
    });
    return promise;
}
exports.encrypt = encrypt;
/**
 * Compares the given string to the hash created using encrypt(). Returns true if the strings match, false otherwise.
 */
async function compareEncryption(notEncrypted, encrypted) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    bcrypt.compare(notEncrypted, encrypted, (err, matches) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(matches);
    });
    return promise;
}
exports.compareEncryption = compareEncryption;
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