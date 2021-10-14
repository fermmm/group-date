import { useQuery, UseQueryOptions } from "react-query";
import { httpRequest } from "../tools/httpRequest";
import {
   ServerInfoParams,
   ServerInfoResponse
} from "../tools/shared-tools/endpoints-interfaces/server-info";

/**
 * This request sends the version of the client to the server and gets information about possible updates
 * needed in the client, service status and other important information.
 */
export function useServerInfo<T extends ServerInfoResponse>(props?: {
   config?: UseQueryOptions<T>;
}) {
   return useQuery<T>(
      "server-info",
      () =>
         httpRequest<ServerInfoParams, T>({
            url: "server-info",
            params: {
               buildVersion: "0.0.0",
               codeVersion: "0.0.0"
            }
         }),
      props?.config
   );
}
