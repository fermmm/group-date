import { tryToGetErrorMessage } from "../httpRequest/tools/tryToGetErrorMessage";

export async function runCodeFromString(code: string) {
   let result: any;

   // Add here as require imports all the function you want available
   const { log } = require("../log-tool/log");
   const { LogId } = require("../log-tool/types");

   try {
      const func = eval(`async () => {return ${code}}`);
      result = await func();
   } catch (e) {
      result = tryToGetErrorMessage(e);
   }

   return result;
}
