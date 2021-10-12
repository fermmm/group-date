import { isProductionMode } from "../../../common-tools/process/process-tools";

export function validateAdminPassword(
   password: string,
   options?: { onlyInProduction?: boolean },
): { isValid: boolean; error?: string } {
   if (options?.onlyInProduction === true && !isProductionMode()) {
      return { isValid: true };
   }

   if ((process.env.ADMIN_PASSWORD ?? "") === "") {
      return {
         isValid: false,
         error: "Error: Set the ADMIN_PASSWORD in the .env file and deploy. There is no ADMIN_PASSWORD set.",
      };
   }

   if (process.env.ADMIN_PASSWORD.length < 6) {
      return {
         isValid: false,
         error: "Admin password in .env is invalid, needs to be 6 characters long or more",
      };
   }

   if (process.env.ADMIN_PASSWORD !== password) {
      return {
         isValid: false,
         error: "Invalid password format",
      };
   }

   return { isValid: true };
}
