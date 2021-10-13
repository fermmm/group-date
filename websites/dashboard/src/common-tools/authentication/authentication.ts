import { AdminProtectionParams } from "../../api/tools/shared-tools/endpoints-interfaces/admin";

export function saveCredentialsInStorage(credentials: AdminProtectionParams) {
   const { user, password } = credentials;

   localStorage.setItem("user", user);
   localStorage.setItem("password", password);
}

export function getCredentialsFromStorage(): AdminProtectionParams {
   return {
      user: localStorage.getItem("user"),
      password: localStorage.getItem("password")
   };
}

export function removeCredentialsFromStorage() {
   localStorage.removeItem("user");
   localStorage.removeItem("password");
}

export function logout() {
   removeCredentialsFromStorage();
}
