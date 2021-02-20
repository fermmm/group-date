import { nanoid } from "nanoid";

export function versionIsCompatible(current: string, required: string): boolean {
   for (let i = 0; i < required.length; i++) {
      if ((current[i] || 0) < required[i]) {
         return false;
      }

      if (current[i] > required[i]) {
         return true;
      }
   }

   return true;
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
