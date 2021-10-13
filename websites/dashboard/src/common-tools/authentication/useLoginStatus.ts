import { useStorageValueExistsWatcher } from "../browser/useStorageWatcher";

export function useLoginStatus(): boolean {
   const hasUser = useStorageValueExistsWatcher("user");
   const hasPassword = useStorageValueExistsWatcher("password");

   return hasUser && hasPassword;
}
