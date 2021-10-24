"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardsGameRoutes = void 0;
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const models_1 = require("./models");
function cardsGameRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/cards-game/recommendations", "GET", models_1.recommendationsGet);
    (0, route_tools_1.createRoute)(r, "/cards-game/disliked-users", "GET", models_1.dislikedUsersGet);
    (0, route_tools_1.createRoute)(r, "/cards-game/from-tag", "GET", models_1.recommendationsFromTagGet);
}
exports.cardsGameRoutes = cardsGameRoutes;
//# sourceMappingURL=routes.js.map