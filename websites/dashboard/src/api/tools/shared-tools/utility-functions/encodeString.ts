/**
 * Encodes a string using encodeURI() to avoid issues with string characters.
 */
export function encodeString(str: string): string {
   return encodeURI(str);
}
