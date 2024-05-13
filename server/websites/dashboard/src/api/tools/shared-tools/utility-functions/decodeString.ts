/**
 * Decodes a string that was encoded using encodeString(), currently just calls decodeURIComponent().
 */
export function decodeString(str: string): string {
   try {
      return decodeURIComponent(str);
   } catch (e) {
      console.log("Warning: decodeURIComponent() failed to decode te following string:", str);
      return str;
   }
}
