import { isProductionMode } from "../../../common-tools/process/process-tools";
import { CredentialsValidationResult } from "../../../shared-tools/endpoints-interfaces/admin";

export function validateAdminCredentials(params: {
   user: string;
   password: string;
   onlyInProduction?: boolean;
}): CredentialsValidationResult {
   const { user, password, onlyInProduction } = params;

   if (onlyInProduction === true && !isProductionMode()) {
      return { isValid: true };
   }

   if ((process.env.ADMIN_USER ?? "") === "") {
      return {
         isValid: false,
         error: "Error: Set the ADMIN_USER in the .env file and deploy. There is no ADMIN_USER set.",
      };
   }

   if ((process.env.ADMIN_PASSWORD ?? "") === "") {
      return {
         isValid: false,
         error: "Error: Set the ADMIN_PASSWORD in the .env file and deploy. There is no ADMIN_PASSWORD set.",
      };
   }

   if (process.env.ADMIN_USER.length < 2) {
      return {
         isValid: false,
         error: "ADMIN_USER in .env is invalid, needs to be 2 characters long or more",
      };
   }

   if (process.env.ADMIN_PASSWORD.length < 6) {
      return {
         isValid: false,
         error: "ADMIN_PASSWORD in .env is invalid, needs to be 6 characters long or more",
      };
   }

   if (process.env.ADMIN_USER !== user || process.env.ADMIN_PASSWORD !== password) {
      return {
         isValid: false,
         error: "Invalid user or password format",
      };
   }

   return { isValid: true };
}
