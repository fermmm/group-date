"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoute = void 0;
const configurations_1 = require("../../configurations");
function createRoute(router, path, method, fn) {
    path = configurations_1.USERS_API_PATH + path;
    if (method === "GET") {
        router.get(path, async (ctx) => (ctx.body = await fn(ctx.request.query, ctx)));
    }
    if (method === "POST") {
        router.post(path, async (ctx) => (ctx.body = await fn(ctx.request.body, ctx)));
    }
    if (method === "PUT") {
        router.put(path, async (ctx) => (ctx.body = await fn(ctx.request.body, ctx)));
    }
    if (method === "PATCH") {
        router.patch(path, async (ctx) => (ctx.body = await fn(ctx.request.body, ctx)));
    }
    if (method === "DELETE") {
        router.del(path, async (ctx) => (ctx.body = await fn(ctx.request.body, ctx)));
    }
    if (method === "ALL") {
        router.all(path, async (ctx) => {
            var _a;
            return (ctx.body = await fn((_a = ctx.request.query) !== null && _a !== void 0 ? _a : ctx.request.body, ctx));
        });
    }
}
exports.createRoute = createRoute;
//# sourceMappingURL=route-tools.js.map