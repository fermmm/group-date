export function tryToGetErrorMessage(error: any): string {
   if (error == null) {
      return "";
   }

   if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
   }

   if (error.response?.data?.[0]?.message != null) {
      return error.response.data[0].message;
   }

   if (error.response?.data != null) {
      return error.response.data;
   }

   if (error.response != null) {
      return error.response;
   }

   if (error.message != null) {
      return error.message;
   }

   return "No information found";
}
