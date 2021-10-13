import { httpRequest } from "../tools/httpRequest";
import {
   AdminProtectionParams,
   CredentialsValidationResult
} from "../tools/shared-tools/endpoints-interfaces/admin";

export async function validateCredentialsGet<
   Params extends AdminProtectionParams,
   Response extends CredentialsValidationResult
>(params: Params): Promise<Response> {
   const url = "admin/validate/credentials";
   return httpRequest({ url, params });
}
