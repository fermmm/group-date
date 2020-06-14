import { setUserEditableProps } from '../../components/user/queries';

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
 *    - Statistical algorithm to use to get mean deviation: Mean Absolute Deviation or Standard Deviation. Default = DeviationAlgorithm.MeanAbsoluteDeviation
 *    - Base amount: This number will be subtracted from every element of the passed array. Default = 0
 *    Example:
 *
 *    ```{ algorithm: DeviationAlgorithm.StandardDeviation, baseAmount: 0}```
 */
export function inequalityLevel(array: number[], settings?: InequalitySettings): number {
   const algorithm: DeviationAlgorithm = settings?.algorithm ?? DeviationAlgorithm.MeanAbsoluteDeviation;
   const baseAmount: number = settings?.baseAmount ?? 0;

   let deviation: number;
   let maximumDeviation: number;
   let result: number;
   if (baseAmount !== 0) {
      array = subtractFromAll(array, baseAmount, false);
   }

   switch (algorithm) {
      case DeviationAlgorithm.MeanAbsoluteDeviation:
         deviation = meanAbsoluteDeviation(array);
         maximumDeviation = maximumMeanAbsoluteDeviation(array);
         break;
      case DeviationAlgorithm.StandardDeviation:
         deviation = standardDeviation(array);
         maximumDeviation = maximumStandardDeviation(array);
         break;
   }

   result = deviation / maximumDeviation;

   if (!Number.isFinite(result)) {
      return 0;
   }
   return result;
}

export interface InequalitySettings {
   algorithm?: DeviationAlgorithm;
   baseAmount?: number;
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

function subtractFromAll(array: number[], amountToSubtract: number, allowNegative: boolean = true): number[] {
   const result: number[] = [...array];
   for (let i = 0; i < array.length; i++) {
      result[i] = result[i] - amountToSubtract;
      if (!allowNegative && result[i] < 0) {
         result[i] = 0;
      }
   }
   return result;
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

function maximumStandardDeviation(array: number[]): number {
   const total: number = sum(array);
   const maxDeviationCase: number[] = array.map((num, i) => (i === 0 ? total : 0));
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

function maximumMeanAbsoluteDeviation(array: number[]): number {
   const total: number = sum(array);
   const maxDeviationCase: number[] = array.map((num, i) => (i === 0 ? total : 0));
   return meanAbsoluteDeviation(maxDeviationCase);
}
