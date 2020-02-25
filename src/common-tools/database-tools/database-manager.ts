import * as gremlin from 'gremlin';
import * as ora from 'ora';

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = traversal().withRemote(new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL));

const spinner: ora.Ora = ora('Waiting for database');
/**
 * The promise of this function resolves only when database starts working
 */
export async function databaseIsWorking(): Promise<void> {
   let resolvePromise: (v?: void | PromiseLike<void>) => void = null;
   const promise = new Promise<void>(r => (resolvePromise = r));

   const timeout = setTimeout(async () => {
      await databaseIsWorking();
      resolvePromise();
   }, 1000);

   spinner.start();
   g.V()
      .limit(1)
      .toList()
      .then(() => {
         clearTimeout(timeout);
         spinner.succeed();
         resolvePromise();
      })
      .catch(error => {
         spinner.fail();
         console.log(error);
      });

   return promise;
}
