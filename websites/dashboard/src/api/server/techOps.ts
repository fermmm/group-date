import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";
import { httpRequest } from "../tools/httpRequest";
import {
   AdminCommandPostParams,
   ExportDatabaseResponse,
   ImportDatabasePostParams,
   SendEmailPostParams,
} from "../tools/shared-tools/endpoints-interfaces/admin";

export async function importDbRequest<Params extends Partial<ImportDatabasePostParams>>(
   params: Params,
): Promise<Response> {
   const url = "admin/db/import";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
}

export async function exportDbRequest<Response extends ExportDatabaseResponse>(): Promise<Response> {
   const url = "admin/db/export";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "GET", params: { ...credentials } });
}

export async function uploadAdminFiles<Params extends Partial<{ files: File[]; folder: string }>>(
   params: Params,
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
   return httpRequest({
      url,
      method: "POST",
      params: formPayLoad,
      urlParams: { ...credentials, folder: params.folder ?? "" },
   });
}

export async function executeCommandRequest<
   Params extends Partial<AdminCommandPostParams>,
   Response extends string,
>(params: Params): Promise<Response> {
   const url = "admin/command";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
}

export async function sendEmailRequest<Params extends Partial<SendEmailPostParams>, Response extends string>(
   params: Params,
): Promise<Response> {
   const url = "admin/email";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
}

export async function deleteDatabaseRequest(): Promise<Response> {
   const url = "admin/db/delete";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: credentials });
}
