import * as Router from "@koa/router";
import {
   adminChatGet,
   adminChatPost,
   allChatsWithAdminsGet,
   convertToAdminPost,
   logFileListGet,
   logGet,
} from "./models";

export function adminRoutes(router: Router): void {
   router.get("/admin/chat", async ctx => (ctx.body = await adminChatGet(ctx.request.query, ctx)));
   router.post("/admin/chat", async ctx => (ctx.body = await adminChatPost(ctx.request.body, ctx)));
   router.get("/admin/chat/all", async ctx => (ctx.body = await allChatsWithAdminsGet(ctx.request.query, ctx)));
   router.get("/admin/logs/files", async ctx => (ctx.body = await logFileListGet(ctx.request.query, ctx)));
   router.get("/admin/log", async ctx => (ctx.body = await logGet(ctx.request.query, ctx)));
   router.post("/admin/convert", async ctx => (ctx.body = await convertToAdminPost(ctx.request.body, ctx)));
}
