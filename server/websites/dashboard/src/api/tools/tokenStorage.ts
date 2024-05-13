import { useMemo } from "react";

export function saveToken(token: string): void {
   localStorage.setItem("token", token);
}

export function getToken(): string {
   return localStorage.getItem("token") as string;
}

export function useToken(externallyProvidedToken?: string): string {
   if (externallyProvidedToken != null) {
      saveToken(externallyProvidedToken);
   }

   return useMemo(getToken, [externallyProvidedToken]);
}
