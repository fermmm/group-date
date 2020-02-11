// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as express from 'express';
import handshake from './components/handshake/routes';
import { databaseExperiments } from './experiments/database';

const app = express();
const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server running on ${port}!`));
app.get('/', (req, res) => res.send('Poly Dates server'));

app.use('/handshake', handshake);

databaseExperiments();
