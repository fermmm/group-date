import * as gremlin from "gremlin";
import { Traversal } from "./gremlin-typing-tools";
import { retryPromise } from "../js-tools/js-tools";
import { MAX_TIME_TO_WAIT_ON_DATABASE_RETRY, REPORT_DATABASE_RETRYING } from "../../configurations";

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = (traversal().withRemote(
   new DriverRemoteConnection(process.env.DATABASE_URL, {}),
) as unknown) as gremlin.process.GraphTraversalSource;
export const __ = (gremlin.process.statics as unknown) as Traversal;
export const withOptions = gremlin.process.withOptions;
export const TextP = gremlin.process.TextP;
export const P = gremlin.process.P;
export const order = gremlin.process.order;
export const column = gremlin.process.column;
export const id = gremlin.process.t.id;
export const scope = gremlin.process.scope;
export const t = gremlin.process.t;

/**
 * The promise of this function resolves only when database responds to a simple query
 *
 *  @param silent Default = false. When true does not send any console.log()
 */
export async function waitForDatabase(): Promise<void> {
   let resolvePromise: (value: void | PromiseLike<void>) => void;
   const result = new Promise<void>(r => (resolvePromise = r));
   let promiseSolved = false;

   console.log("");
   console.log("Waiting for database...");

   const interval = setInterval(() => {
      checkDatabase();
   }, 1000);

   const checkDatabase = () => {
      g.inject(0)
         .toList()
         .then(() => {
            if (!promiseSolved) {
               promiseSolved = true;
               console.log("✓ Database responding!");
               clearInterval(interval);
               resolvePromise();
            }
         })
         .catch(error => {});
   };

   checkDatabase();

   return result;
}

/**
 * Executes the query promise and retries if returns an error. If still returns an error after some time then
 * returns the error of the last try.
 * This is required because of the "ConcurrentModificationException" internal error of a Gremlin database,
 * this error happens because the database accepts more requests even when did not finish a modification of
 * a previous request, so when a request tries to write or read the same information still being saved by a
 * previous request there is a "collision" that generates this error and one or more retries are needed to
 * solve the problem, it uses the "Exponential Backoff" retry approach.
 *
 * @param query The query wrapped into a arrow function like this: retryOnError(() => g.V().toList())
 * @param logResult Default = false. Executes a console.log() with the query response that is configured to show more information than the default console.log()
 */
export async function sendQuery<T>(query: () => Promise<T>, logResult: boolean = false): Promise<T> {
   let result: T;

   try {
      result = await query();
   } catch (error) {
      try {
         if (REPORT_DATABASE_RETRYING) {
            consoleLog("Database retrying");
         }
         // Try again without waiting, maybe a simple retry is enough
         result = await query();
      } catch (error) {
         try {
            if (REPORT_DATABASE_RETRYING) {
               consoleLog("Database retrying");
            }
            // Try again repeatedly waiting more time on each retry
            result = await retryPromise(query, MAX_TIME_TO_WAIT_ON_DATABASE_RETRY, 1);
         } catch (error) {
            // If the amount of retries hit the limit and returned an error log the error
            console.log(`Error from database, all retries failed: ${error}`);
            console.log(error);
         }
      }
   }

   if (logResult) {
      consoleLog(result);
   }

   return result;
}

/**
 * @param path File extension should be xml so gremlin knows it should save with the GraphML format (the most popular and supported).Example: "graph.xml"
 */
export async function saveDatabaseToFile(path: string) {
   await g.io(path).write().iterate();
}

export async function loadDatabaseFromDisk(path: string) {
   await g.io(path).read().iterate();
}
