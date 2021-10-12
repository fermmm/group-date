export function tryToGetErrorMessage(error: any): string {
   if (error === undefined) {
      return "";
   }

   if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
   }

   if (error.response?.data?.[0]?.message !== undefined) {
      return error.response.data[0].message;
   }

   if (error.response?.data !== undefined) {
      return error.response.data;
   }

   if (error.response !== undefined) {
      return error.response;
   }

   if (error.message !== undefined) {
      return `Error: ${error.message}`;
   }

   if (error.msg !== undefined) {
      return `Error: ${error.msg}`;
   }

   let errorAsJson: string | null = null;

   try {
      errorAsJson = JSON.stringify(error);
   } catch {}

   if (errorAsJson !== undefined) {
      return `Error: ${errorAsJson}`;
   }

   return `Unknown error`;
}
