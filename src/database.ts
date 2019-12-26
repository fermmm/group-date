import * as Gremlin from 'gremlin';

async function test(): Promise<void> {
   // Connection:
   const traversal = Gremlin.process.AnonymousTraversalSource.traversal;
   const DriverRemoteConnection = Gremlin.driver.DriverRemoteConnection;
   const g = traversal().withRemote(
      new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL),
   );

   // Query:
   const names2 = await g
      .V()
      .hasLabel('person')
      .values('name')
      .toList();
   console.log(names2);
}

test();
