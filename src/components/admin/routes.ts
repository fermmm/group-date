import * as Router from "@koa/router";
import { adminChatGet, adminChatPost, allChatsWithAdminsGet, convertToAdminPost } from "./models";

export function adminRoutes(router: Router): void {
   router.get("/admin/chat", async ctx => (ctx.body = await adminChatGet(ctx.request.body, ctx)));
   router.post("/admin/chat", async ctx => (ctx.body = await adminChatPost(ctx.request.body, ctx)));
   router.get("/admin/chat/all", async ctx => (ctx.body = await allChatsWithAdminsGet(ctx.request.body, ctx)));
   router.post("/admin/convert", async ctx => (ctx.body = await convertToAdminPost(ctx.request.body, ctx)));
}
