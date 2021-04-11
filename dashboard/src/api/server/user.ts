import { TokenParameter } from "./../tools/shared-tools/endpoints-interfaces/common";
import { useToken } from "./../tools/tokenStorage";
import { User } from "./../tools/shared-tools/endpoints-interfaces/user";
import { useQuery, UseQueryOptions, UseQueryResult } from "react-query";
import { httpRequest } from "../tools/httpRequest";

export function useProfileStatus<Params extends TokenParameter, Response extends User>(props?: {
   params?: Partial<Params>;
   options?: UseQueryOptions<Response>;
}): UseQueryResult<Response> {
   const url = "user/profile-status";
   const token = useToken(props?.params?.token);

   return useQuery<Response>(
      url + token,
      () => httpRequest({ url, params: { token } }),
      props?.options
   );
}
