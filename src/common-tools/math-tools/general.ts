export function replaceNaNInfinity(numberToCheck: number, replaceBy: number): number {
   if (!Number.isFinite(numberToCheck) || Number.isNaN(numberToCheck)) {
      return replaceBy;
   }
   return numberToCheck;
}

/**
 * Executes a Math.round() that affects only the decimals, for example:
 *
 * input: 0.12 output: 0.10
 *
 * input: 0.68 output: 0.70
 *
 */
export function roundDecimals(n: number): number {
   return Math.round(n * 10) / 10;
}
