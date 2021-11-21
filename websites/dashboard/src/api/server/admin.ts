import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";
import { httpRequest } from "../tools/httpRequest";
import {
   BanUserPostParams,
   RemoveAllBanReasonsFromUserPostParams,
   RemoveBanFromUserPostParams,
} from "../tools/shared-tools/endpoints-interfaces/admin";

export async function banUserRequest<
   Params extends Partial<BanUserPostParams>,
   Response extends { success: boolean },
>(params: Params): Promise<Response> {
   const url = "admin/user/ban";
   const credentials = getCredentialsFromStorage();
   return httpRequest({
      url,
      method: "POST",
      params: { ...credentials, ...params },
      handleErrorResponse: true,
   });
}

export async function removeBanFromUserRequest<
   Params extends Partial<RemoveBanFromUserPostParams>,
   Response extends { success: boolean },
>(params: Params): Promise<Response> {
   const url = "admin/user/remove-ban";
   const credentials = getCredentialsFromStorage();
   return httpRequest({
      url,
      method: "POST",
      params: { ...credentials, ...params },
      handleErrorResponse: true,
   });
}

export async function removeAllBansFromUserRequest<
   Params extends Partial<RemoveAllBanReasonsFromUserPostParams>,
   Response extends { success: boolean },
>(params: Params): Promise<Response> {
   const url = "admin/user/remove-all-bans";
   const credentials = getCredentialsFromStorage();
   return httpRequest({
      url,
      method: "POST",
      params: { ...credentials, ...params },
      handleErrorResponse: true,
   });
}
