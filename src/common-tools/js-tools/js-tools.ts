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

/**
 * Divides a number called "total" into chunks with the desired size and executes a callback
 * for each chunk, the callback sends the current chunk size.
 * For example:
 * total = 106 and chunkSize = 50
 * will call the callback 3 times callback(50), callback(50) and callback(6)
 * The callback can be async and one will be executed when the previous finished successfully.
 * This tool can be useful to divide workload.
 */
export async function numberChunksCallback(
   total: number,
   chunkSize: number,
   callback: (chunk: number) => void | Promise<void>,
): Promise<void> {
   if (total <= chunkSize) {
      await callback(total);
      return;
   }

   const chunksAmount: number = Math.ceil(total / chunkSize);
   let unitsDone: number = 0;

   for (let i = 0; i < chunksAmount; i++) {
      if (i < chunksAmount - 1) {
         // All chunks except the last one has the chunkSize
         unitsDone += chunkSize;
         await callback(chunkSize);
         continue;
      }

      // In the last call send the remaining units
      await callback(total - unitsDone);
   }
}

/**
 * Divides an array into smaller chunks arrays and executes a provided callback for each chunk passing the chunk
 * in the callback. The callback can be async. It's useful to call a resource multiple times dividing the workload.
 */
export async function divideArrayCallback<T>(
   array: T[],
   chunkSize: number,
   callback: (chunk: T[]) => void | Promise<void>,
): Promise<void> {
   let i: number = 0;
   await numberChunksCallback(array.length, chunkSize, async currentChunk => {
      await callback(array.slice(i, i + currentChunk));
      i += currentChunk;
   });
}
