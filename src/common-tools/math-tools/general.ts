export function replaceNaNInfinity(numberToCheck: number, replaceBy: number): number {
   if (!Number.isFinite(numberToCheck) || Number.isNaN(numberToCheck)) {
      return replaceBy;
   }
   return numberToCheck;
}
