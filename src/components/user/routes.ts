import * as Router from "@koa/router";
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
   userPropsAsQuestionsGet,
   notificationsGet,
   reportUserPost,
} from "./models";

export function userRoutes(r: Router): void {
   createRoute(r, "/user", "GET", userGet);
   createRoute(r, "/user", "POST", userPost);

   createRoute(r, "/user/profile-status", "GET", profileStatusGet);
   createRoute(r, "/user/props-as-questions", "GET", userPropsAsQuestionsGet);
   createRoute(r, "/user/notifications", "GET", notificationsGet);

   createRoute(r, "/user/set-attraction", "POST", setAttractionPost);
   createRoute(r, "/user/report", "POST", reportUserPost);

   r.post(
      `${USERS_API_PATH}/user/upload-image`,
      onImageFileReceived,
      async ctx => (ctx.body = await onImageFileSaved(ctx.request.files.image as File, ctx)),
   );
}
