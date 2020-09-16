export function hoursToMilliseconds(hours: number): number {
   return hours * 60 * 60 * 1000;
}

/**
 * Performs a shallow comparison of the values of 2 objects using the strict equality operator.
 * Different order of keys does not affect the result.
 */
export function objectsContentIsEqual<T>(object1: T, object2: T): boolean {
   // If the reference is the same the objects are equal.
   if (object1 === object2) {
      return true;
   }

   // If one of the objects is null and the other undefined they are not equal
   if ((object1 === null && object2 === undefined) || (object2 === null && object1 === undefined)) {
      return false;
   }

   // If one of the objects is null or undefined and the other not they are not equal
   if ((object1 == null && object2 != null) || (object2 == null && object1 != null)) {
      return false;
   }

   // Now at this point we are sure that none of both objects are null or undefined so we can compare the elements
   const object1Keys: string[] = Object.keys(object1 ?? {});
   const object2Keys: string[] = Object.keys(object2 ?? {});
   if (object1Keys.length !== object2Keys.length) {
      return false;
   }

   for (const key of object1Keys) {
      if (!object2.hasOwnProperty(key)) {
         return false;
      }
      if (object1[key] !== object2[key]) {
         return false;
      }
   }

   return true;
}
