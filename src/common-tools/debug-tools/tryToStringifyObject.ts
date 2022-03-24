export function tryToStringifyObject<T>(obj: T): string {
   if (obj === undefined) {
      return "undefined";
   }

   if (obj === null) {
      return "null";
   }

   try {
      return JSON.stringify(obj);
   } catch (e) {}

   try {
      return obj.toString();
   } catch (e) {}

   return "tryToStringifyObject() not implemented: " + typeof obj;
}
