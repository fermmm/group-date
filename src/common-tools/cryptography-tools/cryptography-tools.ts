import Cryptr = require("cryptr");
import * as forge from "node-forge";
import { isProductionMode } from "../process/process-tools";
import { generateId } from "../string-tools/string-tools";

const cryptr = new Cryptr(isProductionMode() ? generateId() : "1234");

/**
 * Creates a hash based on the given string. The hash cannot be decoded back to the original string.
 */
export function createHash(dataToEncrypt: string): string {
   var md5 = forge.md.md5.create();
   md5.update(dataToEncrypt);
   return md5.digest().toHex();
}

/**
 * Compares the given string to the hash created using createHash(). Returns true if the strings match, false otherwise.
 */
export function compareHash(notEncrypted: string, encrypted: string) {
   return createHash(notEncrypted) === encrypted;
}

/**
 * Encodes a string into a hash that can be decoded using decode(). For encoding and decoding a password is used.
 * The password is changed every time the server restarts, so after a restart the hash will not be valid. Use this
 * function for temporary transaction of credentials.
 * */
export function encode(text: string): string {
   return cryptr.encrypt(text);
}

/**
 * Decodes a hash that was encoded using encode(). For encoding and decoding a password is used.
 * The password is changed every time the server restarts, so after a restart the hash will not be valid. Use this
 * function for temporary transaction of credentials.
 * */
export function decode(encryptedText: string): string {
   return cryptr.decrypt(encryptedText);
}
