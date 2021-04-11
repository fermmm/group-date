import { stringify } from "query-string";
import { serverUrlComposer } from "./serverUrlComposer";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * Wrapper for fetch for more simplification and issues solved.
 */
export async function httpRequest<Params = null, Response = null>(
   props: HttpRequestParams<Params>
): Promise<Response> {
   let { url, method = "GET", params } = props;
   url = serverUrlComposer(url);
   const settings: AxiosRequestConfig = { url, method };

   if (method === "GET" && params != null) {
      settings.url += "?" + stringify(params);
   }

   if (method === "POST" && params != null) {
      settings.data = params;
   }

   const client: AxiosInstance = axios.create(settings);
   const result = await client(settings);
   return result.data as Response;
}

export interface HttpRequestParams<T> {
   url: string;
   method?: "POST" | "GET" | "PUT" | "DELETE";
   params?: T;
}
