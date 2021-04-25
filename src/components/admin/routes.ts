import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import {
   adminChatGet,
   adminChatPost,
   allChatsWithAdminsGet,
   convertToAdminPost,
   logFileListGet,
   logGet,
} from "./models";

export function adminRoutes(r: Router): void {
   createRoute(r, "/admin/chat", "GET", adminChatGet);
   createRoute(r, "/admin/chat", "POST", adminChatPost);
   createRoute(r, "/admin/chat/all", "GET", allChatsWithAdminsGet);
   createRoute(r, "/admin/logs/files", "GET", logFileListGet);
   createRoute(r, "/admin/log", "GET", logGet);
   createRoute(r, "/admin/convert", "POST", convertToAdminPost);
}
