import * as shell from "shelljs";

type ExitSignal = NodeJS.Signals | "exit" | "uncaughtException" | any;
const exitSignals: ExitSignal[] = [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`];
let initialized: boolean = false;
const functionsToExecute: Array<() => Promise<void> | void> = [];

export function executeFunctionBeforeExiting(fn: () => Promise<void> | void) {
   functionsToExecute.push(fn);

   if (initialized) {
      return;
   }

   exitSignals.forEach(eventType => {
      process.on(eventType, async () => {
         process.stdin.resume();
         for (const fn of functionsToExecute) {
            await fn();
         }
         process.exit();
      });
   });

   initialized = true;
}

export function getNodeEnv(): string {
   // The .? it seems to not work with unknown types
   if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV) {
      return process.env.NODE_ENV.toLocaleLowerCase();
   }

   return "undefined";
}

export function isProductionMode() {
   if (getNodeEnv() === "production") {
      return true;
   }

   return false;
}

export function isUsingNeptune(): boolean {
   return process.env.USING_NEPTUNE_DATABASE === "true" && isProductionMode();
}

export function isUsingS3(): boolean {
   return process.env.USING_S3 === "true" && isProductionMode();
}

export function logEnvironmentMode() {
   console.log("");
   if (isProductionMode()) {
      console.log("Running server in production mode.", process.env.NODE_ENV);
   } else {
      console.log("Running server in development mode.", process.env.NODE_ENV);
   }
   console.log("");
}

export async function executeSystemCommand(command: string): Promise<string> {
   let resolve: (result: string) => void;
   const promise = new Promise<string>(res => {
      resolve = res;
   });
   let result: string = "";
   var child = shell.exec(command, { async: true });
   child.stdout.on("data", data => {
      result += data;
   });
   child.stderr.on("data", data => {
      result += data;
   });
   child.stdout.on("close", () => {
      resolve(result.trim());
   });

   return promise;
}
