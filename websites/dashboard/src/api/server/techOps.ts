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

export async function uploadAdminFiles<Params extends Partial<{ files: File[] }>>(
   params: Params
): Promise<{ fileNames: string[] }> {
   const url = "admin/upload-file";
   const credentials = getCredentialsFromStorage();

   const formPayLoad = new FormData();
   params.files.forEach((file, i) => formPayLoad.append("file" + i, file));

   /**
    * Notice urlParams are used to send the credentials because when sending a
    * FormData no other params can be sent, not even as part of FormData. When
    * sending other parameters the file transfer stops working. So the only way to
    * send other data is through the url params.
    */
   return httpRequest({ url, method: "POST", params: formPayLoad, urlParams: credentials });
}
