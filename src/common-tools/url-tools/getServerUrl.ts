import { isProductionMode } from "../process/process-tools";

export function getServerUrl(): string {
   const hostName = isProductionMode() ? process.env.SERVER_URL : process.env.SERVER_URL_DEVELOPMENT;

   let withPort = hostName;

   if (!isProductionMode()) {
      withPort += ":" + process.env.PORT;
   }

   let withProtocol = withPort;

   if (isProductionMode() && process.env.HTTPS_PORT_ENABLED) {
      withProtocol = "https://" + withProtocol;
   } else {
      withProtocol = "http://" + withProtocol;
   }

   return withProtocol;
}
