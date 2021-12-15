"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMountedFolders = exports.userRoutes = void 0;
const mount = require("koa-mount");
const serve = require("koa-static");
const route_tools_1 = require("../../common-tools/route-tools/route-tools");
const configurations_1 = require("../../configurations");
const models_1 = require("./models");
const log_routes_1 = require("../../common-tools/log-tools/log-routes");
const general_1 = require("../../common-tools/math-tools/general");
function userRoutes(r) {
    (0, route_tools_1.createRoute)(r, "/user", "GET", models_1.userGet);
    (0, route_tools_1.createRoute)(r, "/user", "POST", models_1.userPost);
    (0, route_tools_1.createRoute)(r, "/user/profile-status", "GET", models_1.profileStatusGet);
    (0, route_tools_1.createRoute)(r, "/user/props-as-questions", "GET", models_1.userPropsAsQuestionsGet);
    (0, route_tools_1.createRoute)(r, "/user/notifications", "GET", models_1.notificationsGet);
    (0, route_tools_1.createRoute)(r, "/user/set-attraction", "POST", models_1.setAttractionPost);
    (0, route_tools_1.createRoute)(r, "/user/set-seen", "POST", models_1.setSeenPost);
    (0, route_tools_1.createRoute)(r, "/user/report", "POST", models_1.reportUserPost);
    (0, route_tools_1.createRoute)(r, "/user/tasks/completed", "POST", models_1.taskCompletedPost);
    (0, route_tools_1.createRoute)(r, "/user/delete", "POST", models_1.deleteAccountPost);
    r.post(`${configurations_1.USERS_API_PATH}/user/upload-image`, models_1.onImageFileReceived, async (ctx) => (ctx.body = await (0, models_1.onImageFileSaved)(ctx.request.files.image, ctx)));
}
exports.userRoutes = userRoutes;
function userMountedFolders() {
    return mount("/api/images", (context, next) => {
        (0, log_routes_1.imagesLogger)(context);
        return serve("./uploads/", { maxage: (0, general_1.hoursToMilliseconds)(24) * 360 })(context, next);
    });
}
exports.userMountedFolders = userMountedFolders;
//# sourceMappingURL=routes.js.map