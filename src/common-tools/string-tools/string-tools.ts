import { nanoid } from "nanoid";
import * as semver from "semver";

export function versionIsCompatible(current: string, required: string): boolean {
   return semver.gte(current, required);
}

export function generateId(): string {
   return nanoid();
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
