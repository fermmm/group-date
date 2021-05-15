export function getFacebookAppId(): string {
   const hostName = window.location.hostname;
   if (hostName === "localhost" || hostName === "127.0.0.1") {
      if (Boolean(process.env.REACT_APP_FACEBOOK_APP_ID_FOR_TESTING)) {
         return process.env.REACT_APP_FACEBOOK_APP_ID_FOR_TESTING;
      }
   }
   return process.env.REACT_APP_FACEBOOK_APP_ID;
}
