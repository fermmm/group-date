import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { USERS_API_PATH } from "../../configurations";
import {
   adminChatGet,
   adminChatPost,
   adminNotificationSendPost,
   allChatsWithAdminsGet,
   convertToAdminPost,
   exportDatabaseGet,
   importDatabasePost,
   logFileListGet,
   logGet,
   onAdminFileReceived,
   onAdminFileSaved,
   runCommandPost,
   validateCredentialsGet,
   visualizerPost,
} from "./models";

export function adminRoutes(r: Router): void {
   createRoute(r, "/admin/validate/credentials", "GET", validateCredentialsGet);
   createRoute(r, "/admin/chat", "GET", adminChatGet);
   createRoute(r, "/admin/chat", "POST", adminChatPost);
   createRoute(r, "/admin/chat/all", "GET", allChatsWithAdminsGet);
   createRoute(r, "/admin/logs/files", "GET", logFileListGet);
   createRoute(r, "/admin/log", "GET", logGet);
   createRoute(r, "/admin/convert", "POST", convertToAdminPost);
   createRoute(r, "/admin/db/import", "POST", importDatabasePost);
   createRoute(r, "/admin/db/export", "GET", exportDatabaseGet);
   createRoute(r, "/admin/db/visualizer", "POST", visualizerPost);
   createRoute(r, "/admin/send-notifications", "POST", adminNotificationSendPost);
   createRoute(r, "/admin/command", "POST", runCommandPost);
   r.post(
      `${USERS_API_PATH}/admin/upload-file`,
      onAdminFileReceived,
      async ctx => (ctx.body = await onAdminFileSaved(ctx.request.files, ctx)),
   );
}
