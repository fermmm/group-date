/**
 * Appends the subpath to the server url and returns a full url ready to be used in the requests
 * @param subpath
 */
export function serverUrlComposer(subpath: string): string {
   if (process.env.NODE_ENV === "production") {
      return `${process.env.REACT_APP_SERVER_URL_PRODUCTION}${subpath}`;
   } else {
      return `${process.env.REACT_APP_SERVER_URL_DEVELOPMENT}${subpath}`;
   }
}
