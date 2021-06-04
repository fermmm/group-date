/**
 * Appends the subpath to the server url and returns a full url ready to be used in the requests
 * @param subpath
 */
export function serverUrlComposer(subpath: string): string {
   return `/api/${subpath}/`;
}
