export function hoursToMilliseconds(hours: number): number {
   return hours * 60 * 60 * 1000;
}

/**
 * If the number provided is NaN or Infinity replaces it with another value provided in the second parameter
 */
export function replaceNaNInfinity(numberToCheck: number, replaceBy: number): number {
   if (!Number.isFinite(numberToCheck) || Number.isNaN(numberToCheck)) {
      return replaceBy;
   }
   return numberToCheck;
}

/**
 * Executes a Math.round() that affects only the decimals, for example:
 *
 * input: 0.12 returns: 0.10
 * input: 5.68 returns: 5.70
 *
 */
export function roundDecimals(value: number): number {
   return Math.round(value * 10) / 10;
}

let generateNumberIdLast = 0;
/**
 * Generates a consecutive number with random decimals, so in case of server restarting the number is
 * still not the same
 */
export function generateNumberId(): number {
   return generateNumberIdLast++ + Math.random();
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(min: number, max: number): number {
   min = Math.ceil(min);
   max = Math.floor(max);
   return Math.floor(Math.random() * (max - min + 1)) + min;
}
