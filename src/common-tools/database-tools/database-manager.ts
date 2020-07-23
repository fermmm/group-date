import * as gremlin from 'gremlin';
import * as ora from 'ora';
import { Traversal } from './gremlin-typing-tools';

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = (traversal().withRemote(
   new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL, {}),
) as unknown) as Traversal;
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
   }, 1000);

   spinner?.start();
   g.V()
      .limit(1)
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
 * Executes the query promise and retry once, if at the second try is still throwing an error
 * then lets the error to be thrown as usual.
 * This solves the "ConcurrentModificationException" error that happens when gremlin has
 * too many modifications requests in a short period of time and requires a retry sometimes.
 *
 * @param query The query wraped into a arrow function like this: () => g.V().toList()
 */
export async function retryOnError<T>(query: () => Promise<T>, logResult: boolean = false): Promise<T> {
   try {
      if (logResult) {
         const profileData = await query();
         logComplete(profileData);
         return profileData;
      } else {
         return await query();
      }
   } catch (error) {
      try {
         return await query();
      } catch (error) {
         console.error(error);
         throw new Error(error);
      }
   }
}

export function logComplete<T>(obj: T): void {
   console.dir(obj, { colors: true, depth: 1000 });
}
