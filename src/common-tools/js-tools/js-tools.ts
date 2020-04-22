export async function setTimeoutAsync(milliseconds: number): Promise<void> {
   return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
   });
}
