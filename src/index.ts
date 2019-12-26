// tslint:disable-next-line: no-var-requires
require('dotenv').config();
import * as express from 'express';

const app = express();
const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server running on ${port}!`));

app.get('/', (req, res) => {
   res.send({ message: 'holiss' });
});

app.get('/hello/:value', (req, res) => {
   console.log(`${req.method}: ${req.url}`);
   const str = req.params.value as string;
   res.send({ message: `Hellooo ${str}!` });
});
