import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";
import { GremlinElement } from "../../components/pages/Visualizer/tools/visualizerUtils";
import { httpRequest } from "../tools/httpRequest";
import { AdminNotificationPostParams } from "../tools/shared-tools/endpoints-interfaces/admin";

export async function sendNotificationsPost<
   Params extends Partial<AdminNotificationPostParams>,
   Response extends string
>(params: Params): Promise<Response> {
   const url = "admin/send-notifications";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
}
