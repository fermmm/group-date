import * as dotenv from 'dotenv';
import * as express from 'express';

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server running on ${port}!`));

app.get('/', (req, res) => {
   res.send({ message: 'Polyamory server' });
});

app.get('/hello/:value', (req, res) => {
   console.log(`${req.method}: ${req.url}`);
   const str = req.params.value as string;
   res.send({ message: `Hellooo ${str}!` });
});
