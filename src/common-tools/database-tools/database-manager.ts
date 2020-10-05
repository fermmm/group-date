import * as gremlin from 'gremlin';
import * as ora from 'ora';
import { Traversal } from './gremlin-typing-tools';
import { retryPromise } from '../js-tools/js-tools';
import { MAX_TIME_TO_WAIT_ON_DATABASE_RETRY } from '../../configurations';

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = (traversal().withRemote(
   new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL, {}),
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
 * The promise of this function resolves only when database starts working
 */
export async function waitForDatabase(silent: boolean = false): Promise<void> {
   let spinner: ora.Ora;
   if (!silent) {
      spinner = ora({ text: 'Waiting for database...', spinner: 'noise' });
   }
   let resolvePromise: (v?: void | PromiseLike<void>) => void = null;
   const promise = new Promise<void>(r => (resolvePromise = r));

   const timeout = setTimeout(async () => {
      await waitForDatabase(true);
      spinner?.succeed('Database running!');
      resolvePromise();
   }, 300);

   spinner?.start();
   g.inject(0)
      .toList()
      .then(() => {
         clearTimeout(timeout);
         spinner?.succeed('Database running!');
         resolvePromise();
      })
      .catch(error => {
         spinner?.fail('Database error');
         console.log(error);
      });

   return promise;
}

/**
 * Executes the query promise and retries if returns an error. If still returns an error after some time then
 * returns the error of the last try.
 * This is required because of the "ConcurrentModificationException" internal error of a Gremlin database,
 * this error happens because the database accepts more requests even when did not finish a modification of
 * a previous request, so when a request tries to write or read the same information still being saved by a
 * previous request there is a "collision" that generates this error and one or more a retries are needed to
 * solve the problem, it uses the "Exponential Backoff" approach.
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
         result = await query();
      } catch (error) {
         try {
            result = await retryPromise(query, MAX_TIME_TO_WAIT_ON_DATABASE_RETRY, 1);
         } catch (error) {
            console.log(`Error: ${error?.statusAttributes?.get('exceptions') ?? error}`);
         }
      }
   }

   if (logResult) {
      console.dir(result, { colors: true, depth: 1000 });
   }

   return result;
}
