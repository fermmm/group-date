import { getCredentialsFromStorage } from "../../common-tools/authentication/authentication";
import { GremlinElement } from "../../components/pages/Visualizer/tools/visualizerUtils";
import { httpRequest } from "../tools/httpRequest";
import { VisualizerQueryParams } from "../tools/shared-tools/endpoints-interfaces/admin";

export async function visualizerGet<
   Params extends Partial<VisualizerQueryParams>,
   Response extends GremlinElement[]
>(params: Params): Promise<Response> {
   const url = "admin/db/visualizer";
   const credentials = getCredentialsFromStorage();
   return httpRequest({ url, method: "POST", params: { ...credentials, ...params } });
}
