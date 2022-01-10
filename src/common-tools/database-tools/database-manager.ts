import * as gremlin from "gremlin";
import { Traversal } from "./gremlin-typing-tools";
import { retryPromise } from "../js-tools/js-tools";
import { MAX_TIME_TO_WAIT_ON_DATABASE_RETRY, REPORT_DATABASE_RETRYING } from "../../configurations";
import { isProductionMode } from "../process/process-tools";
import { getFileContent } from "../files-tools/files-tools";

export const databaseUrl = isProductionMode() ? process.env.DATABASE_URL : process.env.DATABASE_URL_DEVELOPMENT;

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = (traversal().withRemote(
   new DriverRemoteConnection(databaseUrl, {}),
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
export const cardinality = gremlin.process.cardinality;

/**
 * The promise of this function resolves only when database responds to a simple query
 *
 *  @param silent Default = false. When true does not send any console.log()
 */
export async function waitForDatabase(): Promise<void> {
   let resolvePromise: (value: void | PromiseLike<void>) => void;
   const result = new Promise<void>(r => (resolvePromise = r));
   let promiseSolved = false;

   console.log(`Database URL is: ${databaseUrl}`);
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
            throw error;
         }
      }
   }

   if (logResult) {
      consoleLog(result);
   }

   return result;
}

/**
 * Sends a query that is in a string format, eg: "g.V().toList()"
 */
export async function sendQueryAsString<T = any>(query: string): Promise<T> {
   const client = new gremlin.driver.Client(databaseUrl, {
      traversalSource: "g",
      mimeType: "application/json",
   });

   // AWS Neptune workaround
   query = query.replace("g.V", "g.inject(0).V");

   return await client.submit(query, {});
}

/**
 * @param path File extension should be xml so gremlin knows it should save with the GraphML format (the most popular and supported).Example: "graph.xml"
 */
export async function exportDatabaseContentToFile(path: string) {
   await g.io(path).write().iterate();
}

export async function importDatabaseContentFromFile(path: string) {
   await g.io(path).read().iterate();
}

// TODO: test it. Maybe we can remove the database content when the queries are ok and ready
export async function importDatabaseContentFromQueryFile(filePaths: string[]) {
   await sendQuery(() => g.V().drop().iterate());
   for (const filePath of filePaths) {
      const fileContent = getFileContent(filePath);
      const queries = fileContent.split(/\r\n|\r|\n/g).filter(query => query.trim().length > 0);
      for (const query of queries) {
         await sendQueryAsString(query);
      }
   }
}
