import { compareHash, createHash } from "../../../common-tools/cryptography-tools/cryptography-tools";
import { isProductionMode } from "../../../common-tools/process/process-tools";
import { CredentialsValidationResult } from "../../../shared-tools/endpoints-interfaces/admin";

export async function validateAdminCredentials(params: {
   user?: string;
   password?: string;
   hash?: string;
   onlyInProduction?: boolean;
}): Promise<CredentialsValidationResult> {
   const { user, password, hash, onlyInProduction } = params;

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

   if (hash != null) {
      try {
         const valid = await compareHash(process.env.ADMIN_USER + process.env.ADMIN_PASSWORD, hash);
         if (valid === true) {
            return { isValid: true };
         }
      } catch (err) {
         return {
            isValid: false,
            error: "Invalid user or password format",
         };
      }
   }

   if (process.env.ADMIN_USER !== user || process.env.ADMIN_PASSWORD !== password) {
      return {
         isValid: false,
         error: "Invalid user or password format",
      };
   }

   return { isValid: true };
}

export function getCredentialsHash() {
   return createHash(process.env.ADMIN_USER + process.env.ADMIN_PASSWORD);
}
