/**
 * Decodes a string using encodeString(), currently just calls decodeURI().
 */
export function decodeString(str: string): string {
   try {
      return decodeURI(str);
   } catch (e) {
      console.log("Warning: decodeUri() failed to decode te following string:", str);
      return str;
   }
}
