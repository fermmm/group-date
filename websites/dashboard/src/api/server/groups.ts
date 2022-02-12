import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";
import { httpRequest } from "../tools/httpRequest";
import { AdminGroupGetParams } from "../tools/shared-tools/endpoints-interfaces/admin";
import { Group } from "../tools/shared-tools/endpoints-interfaces/groups";

export async function adminGroupGetRequest<Params extends Partial<AdminGroupGetParams>, Response extends Group>(
   params: Params,
): Promise<Response> {
   const url = "admin/group";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "GET", params: { ...params, ...credentials } });
}
