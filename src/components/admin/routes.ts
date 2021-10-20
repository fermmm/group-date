import * as Router from "@koa/router";
import { File } from "formidable";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { USERS_API_PATH } from "../../configurations";
import {
   adminChatGet,
   adminChatPost,
   adminNotificationPost,
   allChatsWithAdminsGet,
   convertToAdminPost,
   loadCsvPost,
   logFileListGet,
   logGet,
   onAdminFileReceived,
   onAdminFileSaved,
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
   createRoute(r, "/admin/notification", "POST", adminNotificationPost);
   createRoute(r, "/admin/db/loadcsv", "POST", loadCsvPost);
   createRoute(r, "/admin/db/visualizer", "POST", visualizerPost);
   r.post(
      `${USERS_API_PATH}/admin/upload-file`,
      onAdminFileReceived,
      async ctx => (ctx.body = await onAdminFileSaved(ctx.request.files.image as File, ctx)),
   );
}
