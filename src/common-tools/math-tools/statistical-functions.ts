/**
 * Given a set of numbers gets the inequality between them using the formula:
 * "All element's distance from the mean" divided by "maximum possible distance"
 *
 * Examples:
 *
 *    [6,0,0] returns: 1 (total inequality)
 *    [3,3,3] returns: 0 (total equality)
 *    [0,5,1] returns: 0.75
 *
 * @param array The set of numbers
 * @param settings With this parameter you can configure:
 *    - The statistical algorithm to use to get mean deviation: Mean Absolute Deviation or Standard Deviation. Default = DeviationAlgorithm.MeanAbsoluteDeviation
 *    - The minimum amount possible: default = 0
 *
 *    Example:
 *
 *    ```{ algorithm: DeviationAlgorithm.StandardDeviation, minimum: 2 }```
 */
export function inequalityLevel(array: number[], settings?: InequalitySettings): number {
   const minimum: number = settings?.minimum ?? 0;
   const algorithm: DeviationAlgorithm = settings?.algorithm ?? DeviationAlgorithm.MeanAbsoluteDeviation;
   let result: number;
   switch (algorithm) {
      case DeviationAlgorithm.MeanAbsoluteDeviation:
         result = meanAbsoluteDeviation(array) / maximumMeanAbsoluteDeviation(array, minimum);
      case DeviationAlgorithm.StandardDeviation:
         result = standardDeviation(array) / maximumStandardDeviation(array, minimum);
   }
   if (!Number.isFinite(result)) {
      return 0;
   }
   return result;
}

export interface InequalitySettings {
   algorithm?: DeviationAlgorithm;
   minimum?: number;
}

export enum DeviationAlgorithm {
   MeanAbsoluteDeviation,
   StandardDeviation,
}

function sum(array: number[]): number {
   let num: number = 0;
   for (let i = 0, l = array.length; i < l; i++) {
      num += array[i];
   }
   return num;
}

function mean(array: number[]): number {
   return sum(array) / array.length;
}

function variance(array: number[]): number {
   const arrayMean: number = mean(array);
   return mean(
      array.map(num => {
         return Math.pow(num - arrayMean, 2);
      }),
   );
}

/**
 * This returns the "Population Standard Deviation" (dividing by N), and not
 * the "Sample Standard Deviation" (dividing by N-1)
 */
function standardDeviation(array: number[]): number {
   return Math.sqrt(variance(array));
}

function maximumStandardDeviation(array: number[], minimum: number = 0): number {
   const total: number = sum(array);
   const maxDeviationCase: number[] = array.map((num, i) => (i === 0 ? total : minimum));
   return standardDeviation(maxDeviationCase);
}

function meanAbsoluteDeviation(array: number[]): number {
   const arrayMean: number = mean(array);
   return mean(
      array.map(num => {
         return Math.abs(num - arrayMean);
      }),
   );
}

function maximumMeanAbsoluteDeviation(array: number[], minimum: number = 0): number {
   const total: number = sum(array);
   const maxDeviationCase: number[] = array.map((num, i) => (i === 0 ? total : minimum));
   return meanAbsoluteDeviation(maxDeviationCase);
}
