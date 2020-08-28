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
