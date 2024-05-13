import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import {
   blockTagsPost,
   createTagPost,
   removeTagsPost,
   subscribeToTagsPost,
   tagsGet,
   tagsCreatedByUserGet,
   removeSubscriptionToTagsPost,
   removeBlockToTagsPost,
} from "./models";

export function tagsRoutes(r: Router): void {
   createRoute(r, "/tags", "GET", tagsGet);
   createRoute(r, "/tags/created", "GET", tagsCreatedByUserGet);

   createRoute(r, "/tags/create", "POST", createTagPost);
   createRoute(r, "/tags/subscribe", "POST", subscribeToTagsPost);
   createRoute(r, "/tags/block", "POST", blockTagsPost);
   createRoute(r, "/tags/subscribe/remove", "POST", removeSubscriptionToTagsPost);
   createRoute(r, "/tags/block/remove", "POST", removeBlockToTagsPost);
   createRoute(r, "/tags/remove", "POST", removeTagsPost);
}
