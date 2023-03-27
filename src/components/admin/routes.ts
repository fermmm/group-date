import * as Router from "@koa/router";
import * as mount from "koa-mount";
import * as serve from "koa-static";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { USERS_API_PATH } from "../../configurations";
import {
   adminChatGet,
   adminChatPost,
   adminNotificationSendPost,
   allChatsWithAdminsGet,
   banUserPost,
   convertToAdminPost,
   deleteDbPost,
   exportDatabase2Get,
   exportDatabaseGet,
   forceXmlDatabaseBackupGet,
   getGroup,
   importDatabasePost,
   logDeleteEntryPost,
   logFileListGet,
   logGet,
   notificationStatusGet,
   onAdminFileReceived,
   onAdminFileSaved,
   queryPost,
   removeAllBanReasonsFromUser,
   removeBanFromUserPost,
   runCodePost,
   runCommandPost,
   sendEmailPost,
   validateCredentialsGet,
   visualizerPost,
} from "./models";
import { validateAdminCredentials } from "./tools/validateAdminCredentials";

// TODO: Endpoints here need a validator (for security)
export function adminRoutes(r: Router): void {
   createRoute(r, "/admin/validate/credentials", "GET", validateCredentialsGet);
   // Currently this is not used in the client this is why it's commented. It's working when uncommented the only thing that needs is a validator (for security)
   // createRoute(r, "/admin/chat", "GET", adminChatGet);
   // createRoute(r, "/admin/chat", "POST", adminChatPost);
   // createRoute(r, "/admin/chat/all", "GET", allChatsWithAdminsGet);
   createRoute(r, "/admin/logs/files", "GET", logFileListGet);
   createRoute(r, "/admin/log", "GET", logGet);
   createRoute(r, "/admin/log/entry/delete", "POST", logDeleteEntryPost);
   createRoute(r, "/admin/convert", "POST", convertToAdminPost);
   createRoute(r, "/admin/db/import", "POST", importDatabasePost);
   createRoute(r, "/admin/db/export", "GET", exportDatabaseGet);
   createRoute(r, "/admin/db/export2", "GET", exportDatabase2Get);
   createRoute(r, "/admin/db/force", "GET", forceXmlDatabaseBackupGet);
   createRoute(r, "/admin/db/visualizer", "POST", visualizerPost);
   createRoute(r, "/admin/db/query", "POST", queryPost);
   createRoute(r, "/admin/db/delete", "POST", deleteDbPost);
   createRoute(r, "/admin/send-notifications", "POST", adminNotificationSendPost);
   createRoute(r, "/admin/notification-status", "GET", notificationStatusGet);
   createRoute(r, "/admin/command", "POST", runCommandPost);
   createRoute(r, "/admin/run-code", "POST", runCodePost);
   createRoute(r, "/admin/email", "POST", sendEmailPost);
   createRoute(r, "/admin/group", "GET", getGroup);
   createRoute(r, "/admin/user/ban", "POST", banUserPost);
   createRoute(r, "/admin/user/remove-ban", "POST", removeBanFromUserPost);
   createRoute(r, "/admin/user/remove-all-bans", "POST", removeAllBanReasonsFromUser);
   r.post(
      `${USERS_API_PATH}/admin/upload-file`,
      onAdminFileReceived,
      async ctx => (ctx.body = await onAdminFileSaved(ctx.request.files, ctx)),
   );
}

export function adminMountedFolders() {
   return mount("/api/admin-uploads", async (context, next) => {
      const validationResult = await validateAdminCredentials({ hash: context.request.query.hash as string });
      if (!validationResult.isValid) {
         return;
      }
      return serve("./admin-uploads/")(context, next);
   });
}
