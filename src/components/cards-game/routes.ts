import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { dislikedUsersGet, recommendationsFromTagGet, recommendationsGet } from "./models";

export function cardsGameRoutes(r: Router): void {
   createRoute(r, "/cards-game/recommendations", "GET", recommendationsGet);
   createRoute(r, "/cards-game/disliked-users", "GET", dislikedUsersGet);
   createRoute(r, "/cards-game/from-tag", "GET", recommendationsFromTagGet);
}
