import * as bcrypt from "bcrypt";
import Cryptr = require("cryptr");
import { isProductionMode } from "../process/process-tools";
import { generateId } from "../string-tools/string-tools";

const cryptr = new Cryptr(isProductionMode() ? generateId() : "1234");

/**
 * Creates a hash based on the given string. The hash cannot be decoded back to the original string.
 */
export async function encrypt(dataToEncrypt: string): Promise<string> {
   let resolve: (hash: string) => void;
   let reject: (error: Error) => void;
   const promise = new Promise<string>((res, rej) => {
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

/**
 * Compares the given string to the hash created using encrypt(). Returns true if the strings match, false otherwise.
 */
export async function compareEncryption(notEncrypted: string, encrypted: string) {
   let resolve: (valid: boolean) => void;
   let reject: (error: Error) => void;
   const promise = new Promise<boolean>((res, rej) => {
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
