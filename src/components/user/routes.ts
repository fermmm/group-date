import * as Router from "@koa/router";
import {
   onFileReceived,
   onFileSaved,
   profileStatusGet,
   setAttractionPost,
   userGet,
   userPost,
   userPropsAsQuestionsGet,
} from "./models";

export function userRoutes(router: Router): void {
   router.get("/user", async ctx => (ctx.body = await userGet(ctx.request.body, ctx)));
   router.post("/user", async ctx => (ctx.body = await userPost(ctx.request.body, ctx)));
   router.get("/user/profile-status", async ctx => (ctx.body = await profileStatusGet(ctx.request.body, ctx)));
   router.get("/user/props-as-questions", async ctx => (ctx.body = userPropsAsQuestionsGet(ctx)));
   router.post(
      "/user/set-attraction",
      async ctx => (ctx.body = await setAttractionPost(ctx.request.body, ctx)),
   );
   router.post(
      "/user/upload-picture",
      onFileReceived,
      async ctx => (ctx.body = await onFileSaved(ctx.request.files.image, ctx)),
   );
}
