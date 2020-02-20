import * as gremlin from 'gremlin';

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = traversal().withRemote(new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL));

/**
 * Throws an errors on the console if the database is not running until starts running.
 */
export async function checkDatabaseStatus(): Promise<void> {
   let resolvePromise: (value?: void | PromiseLike<void>) => void = null;
   const promise = new Promise<void>(r => resolvePromise = r);

   const timer = setTimeout(
      async () => {
         console.error('Database not responding. Did you start the gremlin database?');
         resolvePromise();
         checkDatabaseStatus();
      },
      2000,
   );
   try {
      await g
         .V()
         .valueMap(true)
         .limit(1)
         .toList();
      clearTimeout(timer);
      console.log("Database running!");
      return resolvePromise();
   } catch (error) {
      console.log(error);
      clearTimeout(timer);
      resolvePromise();
   }

   return promise;
}
