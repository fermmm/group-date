import * as Router from "@koa/router";
import * as mount from "koa-mount";
import * as serve from "koa-static";
import { File } from "formidable";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import { USERS_API_PATH } from "../../configurations";
import {
   onImageFileReceived,
   onImageFileSaved,
   profileStatusGet,
   setAttractionPost,
   userGet,
   userPost,
   notificationsGet,
   reportUserPost,
   deleteAccountPost,
   setSeenPost,
   taskCompletedPost,
   blockUserPost,
   unblockUserPost,
   questionsGet,
} from "./models";
import { imagesLogger } from "../../common-tools/debug-tools/log-routes";
import { hoursToMilliseconds } from "../../common-tools/math-tools/general";

export function userRoutes(r: Router): void {
   createRoute(r, "/user", "GET", userGet);
   createRoute(r, "/user", "POST", userPost);

   createRoute(r, "/user/questions", "GET", questionsGet);

   createRoute(r, "/user/profile-status", "GET", profileStatusGet);
   createRoute(r, "/user/notifications", "GET", notificationsGet);

   createRoute(r, "/user/set-attraction", "POST", setAttractionPost);
   createRoute(r, "/user/set-seen", "POST", setSeenPost);
   createRoute(r, "/user/report", "POST", reportUserPost);
   createRoute(r, "/user/block", "POST", blockUserPost);
   createRoute(r, "/user/unblock", "POST", unblockUserPost);
   createRoute(r, "/user/tasks/completed", "POST", taskCompletedPost);
   createRoute(r, "/user/delete", "POST", deleteAccountPost);

   r.post(
      `${USERS_API_PATH}/user/upload-image`,
      onImageFileReceived,
      async ctx => (ctx.body = await onImageFileSaved(ctx.request.files.image as File, ctx)),
   );
}

export function userMountedFolders() {
   return mount("/api/images", (context, next) => {
      imagesLogger(context);
      return serve("./uploads/", { maxage: hoursToMilliseconds(24) * 360 })(context, next);
   });
}
