import { httpRequest } from "../tools/httpRequest";
import { Tag, TagGetParams } from "../tools/shared-tools/endpoints-interfaces/tags";

export async function tagsGetRequest<Params extends TagGetParams, Response extends Tag[]>(
   params: Params,
): Promise<Response> {
   const url = "tags";
   return httpRequest({ url, method: "GET", params: { ...params } });
}
