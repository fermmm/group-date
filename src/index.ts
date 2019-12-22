// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as express from 'express';
import { dbTest } from './database';

const app = express();
const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server running on ${port}!`));

app.get('/', (req, res) => {
  dbTest();
  res.send({ message: process.env.TEST });
});

app.get('/hello/:value', (req, res) => {
  console.log(`${req.method}: ${req.url}`);
  const str = req.params.value as string;
  res.send({ message: `Hellooo ${str}!` });
});
