/**
 * Encodes a string using encodeURIComponent() to avoid issues with string characters.
 */
export function encodeString(str: string): string {
   if (str == null) {
      return str;
   }
   return encodeURIComponent(str);
}
