"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupsRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function groupsRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/group", "GET", models_1.groupGet);
    (0, route_tools_1.createRoute)(r, "/user/groups", "GET", models_1.userGroupsGet);
    (0, route_tools_1.createRoute)(r, "/group/chat", "GET", models_1.chatGet);
    (0, route_tools_1.createRoute)(r, "/group/chat/unread/amount", "GET", models_1.chatUnreadAmountGet);
    (0, route_tools_1.createRoute)(r, "/group/votes/result", "GET", models_1.voteResultGet);
    (0, route_tools_1.createRoute)(r, "/group/ideas/vote", "POST", models_1.dateIdeaVotePost);
    (0, route_tools_1.createRoute)(r, "/group/days/vote", "POST", models_1.dateDayVotePost);
    (0, route_tools_1.createRoute)(r, "/group/chat", "POST", models_1.chatPost);
    (0, route_tools_1.createRoute)(r, "/group/seen", "POST", models_1.groupSeenPost);
}
exports.groupsRoutes = groupsRoutes;
//# sourceMappingURL=routes.js.map