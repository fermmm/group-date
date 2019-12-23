import * as Gremlin from 'gremlin';

console.log('Setting up autentication...');
const authenticator = new Gremlin.driver.auth.PlainTextSaslAuthenticator(
  `/dbs/${process.env.DATABASE_NAME}/colls/${process.env.DATABASE_COLLECTION}`,
  process.env.DATABASE_PRIMARY_KEY_PROD,
);

console.log('Starting Gremlin client...');
const client = new Gremlin.driver.Client(process.env.DATABASE_URL_PROD, {
  authenticator,
  traversalsource: 'g',
  rejectUnauthorized: true,
  mimeType: 'application/vnd.gremlin-v2.0+json',
});

async function dBOpen(): Promise<void> {
  try {
    return Promise.resolve(await client.open());
  } catch (error) {
    console.error('Error opening db');
    console.error(error);
    return Promise.resolve();
  }
}

async function dBCall(
  message: string | Gremlin.process.Bytecode,
  bindings?: any,
): Promise<unknown> {
  try {
    return Promise.resolve(await client.submit(message, bindings));
  } catch (error) {
    console.error('Error running query...');
    console.error(error);
    return Promise.reject(error);
  }
}

async function dBClose(): Promise<void> {
  try {
    return Promise.resolve(await client.close());
  } catch (error) {
    console.error('Error closeing db');
    console.error(error);
    return Promise.reject(error);
  }
}

async function dropGraph(): Promise<unknown> {
  console.log('Running Drop');
  const result = await dBCall('g.V().drop()', {});
  console.log('Result: %s\n', JSON.stringify(result));
  return Promise.resolve(result);
}

async function addVertex1() {
  console.log('Running Add Vertex1');
  const result = await dBCall(
    `g.addV(label).property('id', id).property('firstName', firstName).property('age', age).property('userid', userid).property('${
      process.env.DATABASE_PARTITION_NAME_GENERAL
    }', '${process.env.DATABASE_PARTITION_NAME_GENERAL}')`,
    {
      label: 'person',
      id: 'thomas',
      firstName: 'Thomas',
      age: 44,
      userid: 1,
    },
  );
  console.log('Result: %s\n', JSON.stringify(result));
  return Promise.resolve(result);
}

async function addVertex2() {
  console.log('Running Add Vertex2');
  const result = await dBCall(
    `g.addV(label).property('id', id).property('firstName', firstName).property('lastName', lastName).property('age', age).property('userid', userid).property('${
      process.env.DATABASE_PARTITION_NAME_GENERAL
    }', '${process.env.DATABASE_PARTITION_NAME_GENERAL}')`,
    {
      label: 'person',
      id: 'mary',
      firstName: 'Mary',
      lastName: 'Andersen',
      age: 39,
      userid: 2,
    },
  );
  console.log('Result: %s\n', JSON.stringify(result));
  return Promise.resolve(result);
}

async function addEdge() {
  console.log('Running Add Edge');
  const result = await dBCall(
    'g.V(source).addE(relationship).to(g.V(target))',
    {
      source: 'thomas',
      relationship: 'knows',
      target: 'mary',
    },
  );
  console.log('Result: %s\n', JSON.stringify(result));
  return Promise.resolve(result);
}

async function countVertices() {
  console.log('Running Count');
  const result = await dBCall('g.V().count()', {});
  console.log('Result: %s\n', JSON.stringify(result));
  return Promise.resolve(result);
}

function finish() {
  console.log('Finished');
  console.log('Press any key to exit');

  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
}

export async function dbTest(): Promise<void> {
  await dBOpen();
  await dropGraph();
  await addVertex1();
  await addVertex2();
  await addEdge();
  await countVertices();
  await dBClose();
  finish();

  // client.open()
  //   .then(dropGraph)
  //   .then(addVertex1)
  //   .then(addVertex2)
  //   .then(addEdge)
  //   .then(countVertices)
  //   .catch((err) => {
  //     console.error("Error running query...");
  //     console.error(err)
  //   }).then((res) => {
  //     client.close();
  //     finish();
  //   }).catch((err) =>
  //     console.error("Fatal error:", err)
  //   );
}
