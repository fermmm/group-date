import { Middleware } from 'koa';
import Application = require('koa');

export type UseFunction = (middleware: Middleware) => Application;
