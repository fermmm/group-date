import * as gremlin from 'gremlin';

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

export const g = traversal().withRemote(new DriverRemoteConnection(process.env.DATABASE_URL_LOCAL));
