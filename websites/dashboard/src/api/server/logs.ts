import { useToken } from "./../tools/tokenStorage";
import { TokenParameter } from "./../tools/shared-tools/endpoints-interfaces/common";
import {
   AdminDeleteLogEntryParams,
   AdminLogGetParams,
   LogFileListResponse,
   LogResponse,
} from "./../tools/shared-tools/endpoints-interfaces/admin";
import { useQuery, UseQueryOptions, UseQueryResult } from "react-query";
import { httpRequest } from "../tools/httpRequest";
import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";

export function useLogsFileList<Response extends LogFileListResponse[]>(props?: {
   options?: UseQueryOptions<Response>;
}): UseQueryResult<Response> {
   const url = "admin/logs/files";
   const credentials = getCredentialsFromStorage();

   return useQuery<Response>(url, () => httpRequest({ url, params: { ...credentials } }), props?.options);
}

export function useLog<Params extends Partial<AdminLogGetParams>, Response extends LogResponse>(props: {
   params: Params;
   options?: UseQueryOptions<Response>;
}): UseQueryResult<Response> {
   let { params } = props;
   const credentials = getCredentialsFromStorage();

   const url = "admin/log";
   return useQuery<Response>(
      url + params.logId,
      () => httpRequest({ url, params: { ...params, ...credentials } }),
      props?.options,
   );
}

export async function deleteLogEntryPost<
   Params extends Partial<AdminDeleteLogEntryParams>,
   Response extends { success: boolean },
>(params: Params): Promise<Response> {
   const url = "admin/log/entry/delete";
   const credentials = getCredentialsFromStorage();
   const response = await httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
   return response;
}
