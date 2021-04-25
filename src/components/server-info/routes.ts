import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { serverInfoGet } from "./models";

export function serverInfoRoutes(r: Router): void {
   createRoute(r, "/server-info", "GET", serverInfoGet);
}
