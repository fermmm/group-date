import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import {
   chatPost,
   dateDayVotePost,
   dateIdeaVotePost,
   feedbackPost,
   groupGet,
   userGroupsGet,
   chatGet,
   voteResultGet,
   chatUnreadAmountGet,
   groupSeenPost,
} from "./models";

export function groupsRoutes(r: Router): void {
   createRoute(r, "/group", "GET", groupGet);
   createRoute(r, "/user/groups", "GET", userGroupsGet);
   createRoute(r, "/group/chat", "GET", chatGet);
   createRoute(r, "/group/chat/unread/amount", "GET", chatUnreadAmountGet);
   createRoute(r, "/group/votes/result", "GET", voteResultGet);

   createRoute(r, "/group/ideas/vote", "POST", dateIdeaVotePost);
   createRoute(r, "/group/days/vote", "POST", dateDayVotePost);
   createRoute(r, "/group/chat", "POST", chatPost);
   createRoute(r, "/group/seen", "POST", groupSeenPost);
   createRoute(r, "/group/feedback", "POST", feedbackPost);
}
