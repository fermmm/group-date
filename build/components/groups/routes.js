"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupsRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function groupsRoutes(r) {
    route_tools_1.createRoute(r, "/group", "GET", models_1.groupGet);
    route_tools_1.createRoute(r, "/user/groups", "GET", models_1.userGroupsGet);
    route_tools_1.createRoute(r, "/group/chat", "GET", models_1.chatGet);
    route_tools_1.createRoute(r, "/group/chat/unread/amount", "GET", models_1.chatUnreadAmountGet);
    route_tools_1.createRoute(r, "/group/votes/result", "GET", models_1.voteResultGet);
    route_tools_1.createRoute(r, "/group/ideas/vote", "POST", models_1.dateIdeaVotePost);
    route_tools_1.createRoute(r, "/group/days/vote", "POST", models_1.dateDayVotePost);
    route_tools_1.createRoute(r, "/group/chat", "POST", models_1.chatPost);
    route_tools_1.createRoute(r, "/group/seen", "POST", models_1.groupSeenPost);
}
exports.groupsRoutes = groupsRoutes;
//# sourceMappingURL=routes.js.map