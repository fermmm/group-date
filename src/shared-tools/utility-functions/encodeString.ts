/**
 * Encodes a string using encodeURIComponent() to avoid issues with string characters.
 */
export function encodeString(str: string): string {
   return encodeURIComponent(str);
}
