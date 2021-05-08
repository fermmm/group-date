import { QueryClient } from "react-query";

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: Infinity,
         structuralSharing: false,
         retry: false,
         refetchOnWindowFocus: false
      }
   }
});
