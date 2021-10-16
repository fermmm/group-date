import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";
import { httpRequest } from "../tools/httpRequest";
import { LoadCsvPostParams } from "../tools/shared-tools/endpoints-interfaces/admin";

export async function loadCSVRequest<Params extends Partial<LoadCsvPostParams>>(
   params: Params
): Promise<Response> {
   const url = "admin/db/loadcsv";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
}
