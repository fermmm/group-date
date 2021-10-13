import { useToken } from "./../tools/tokenStorage";
import { TokenParameter } from "./../tools/shared-tools/endpoints-interfaces/common";
import { AdminLogGetParams } from "./../tools/shared-tools/endpoints-interfaces/admin";
import { useQuery, UseQueryOptions, UseQueryResult } from "react-query";
import { httpRequest } from "../tools/httpRequest";
import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";

export function useLogsFileList<Response extends string[]>(props?: {
   options?: UseQueryOptions<Response>;
}): UseQueryResult<Response> {
   const url = "admin/logs/files";
   const credentials = getCredentialsFromStorage();

   return useQuery<Response>(
      url,
      () => httpRequest({ url, params: { ...credentials } }),
      props?.options
   );
}

export function useLog<Params extends Partial<AdminLogGetParams>, Response extends string>(props: {
   params: Params;
   options?: UseQueryOptions<Response>;
}): UseQueryResult<Response> {
   let { params } = props;
   const credentials = getCredentialsFromStorage();

   const url = "admin/log";
   return useQuery<Response>(
      url + params.fileName,
      () => httpRequest({ url, params: { ...params, ...credentials } }),
      props?.options
   );
}
