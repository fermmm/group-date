/**
 * Appends the subpath to the server url and returns a full url ready to be used in the requests
 * @param subpath
 */
export function serverUrlComposer(subpath: string): string {
   return `http://${window.location.hostname}:${process.env.REACT_APP_SERVER_ENDPOINTS_PORT}/api/${subpath}/`;
}
