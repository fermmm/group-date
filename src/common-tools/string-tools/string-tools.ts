import { nanoid } from "nanoid";
import * as semver from "semver";

export function versionIsCompatible(current: string, required: string): boolean {
   return semver.gte(current, required);
}

/**
 * Generate secure URL-friendly unique ID.
 *
 * By default, the ID will have 21 symbols to have a collision probability similar to UUID v4.
 *
 * @param size Size of the ID. The default size is 21.
 * @returns A random string
 */
export function generateId(size: number = 21): string {
   return nanoid(size);
}

/**
 * Converts the first character of a string to upper case
 */
export function toFirstUpperCase(str: string): string {
   if (str == null) {
      return str;
   }

   if (str.length < 1) {
      return str;
   }

   return str.charAt(0).toUpperCase() + str.slice(1);
}

export function strToBool(str: string | undefined): boolean {
   return str?.toLowerCase().split(" ").join("") === "true";
}
