import * as Router from "@koa/router";
import { createRoute } from "../../common-tools/route-tools/route-tools";
import {
   changePasswordPost,
   confirmEmailPost,
   createAccountPost,
   loginGet,
   resetPasswordPost,
   userExistsGet,
} from "./models";

export function emailLoginRoutes(r: Router): void {
   createRoute(r, "/email-login/create-account", "POST", createAccountPost);
   createRoute(r, "/email-login/confirm-email", "POST", confirmEmailPost);
   createRoute(r, "/email-login/login", "GET", loginGet);
   createRoute(r, "/email-login/reset-password", "POST", resetPasswordPost);
   createRoute(r, "/email-login/change-password", "POST", changePasswordPost);
   createRoute(r, "/email-login/user-exists", "GET", userExistsGet);
}
