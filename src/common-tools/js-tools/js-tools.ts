export async function setTimeoutAsync(milliseconds: number): Promise<void> {
   return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
   });
}

export function hoursToMilliseconds(hours: number): number {
   return hours * 60 * 60 * 1000;
}
