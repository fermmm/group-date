import * as express from 'express';
import { serverOperating, validateVersion } from './models';
const router = express.Router();

// TODO: Probar Koa por lo de res.locals que es malisimo Esto no va junto
// con el login por que el mismo proceso de login puede cambiar
// osea podria ser necesario actualizar el cliente para poder logarse
router.post('/', 
   serverOperating, 
   validateVersion, 
   (req, res) => res.send(res.locals)
);

export default router;