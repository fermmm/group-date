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

export function isProductionMode() {
   // The .? it seems to not work with unknown types
   if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === "production") {
      return true;
   }

   return false;
}

export function logEnvironmentMode() {
   if (isProductionMode()) {
      console.log("Running server in production mode.");
   } else {
      console.log("Running server in development mode.");
   }
}
