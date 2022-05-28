/**
 * Decodes a string using encodeString(), currently just calls decodeURI().
 */
export function decodeString(str: string): string {
   return decodeURI(str);
}
