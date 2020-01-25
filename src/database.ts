import * as gremlin from 'gremlin';

export async function test(): Promise<void> {
   // Connection:
   const traversal = gremlin.process.AnonymousTraversalSource.traversal;
   const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
   const g = traversal().withRemote(
      new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL),
   );

   g.V()
      .drop()
      .iterate();
   const { id } = gremlin.process.t;
   const { within } = gremlin.process.P;

   // Create
   console.log(
      await g
         .addV('person')
         .property(gremlin.process.t.id, 5)
         .property('name', 'marko')
         .next(),
   );

   // Retreive:
   const names2 = await g
      .V()
      .valueMap(true)
      .toList();
   console.log(typeof names2);
   console.log(names2[0]);
}
