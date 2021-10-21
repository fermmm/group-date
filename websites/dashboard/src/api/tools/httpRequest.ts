import { stringify } from "query-string";
import { serverUrlComposer } from "./serverUrlComposer";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * Wrapper for fetch for more simplification and issues solved.
 */
export async function httpRequest<Response = null, Params = any, UrlParams = any>(
   props: HttpRequestParams<Params, UrlParams>
): Promise<Response> {
   let { url, method = "GET", params, urlParams } = props;
   url = serverUrlComposer(url);
   const settings: AxiosRequestConfig = { url, method };

   if (method === "GET" && (params != null || urlParams != null)) {
      settings.url += "?" + stringify(params ?? urlParams);
   }

   // GET already has url params up there, but other methods can also have url params
   if (method !== "GET" && urlParams != null) {
      settings.url += "?" + stringify(urlParams);
   }

   if (method === "POST" && params != null) {
      settings.data = params;
   }

   const client: AxiosInstance = axios.create(settings);
   const result = await client(settings);
   return result.data as Response;
}

export interface HttpRequestParams<Params = null, UrlParams = null> {
   url: string;
   method?: "POST" | "GET" | "PUT" | "DELETE";
   params?: Params;
   urlParams?: UrlParams;
}
