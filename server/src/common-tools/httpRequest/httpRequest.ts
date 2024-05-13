import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { stringify } from "query-string";
import { HttpRequestResponse } from "../database-tools/typing-tools/typing-tools";
import { tryToGetErrorMessage } from "./tools/tryToGetErrorMessage";

export interface AxiosRequestConfigExtended<T = any> extends AxiosRequestConfig {
   /**
    * In a GET request the params goes in the url and the POST request on the data value.
    * This property is universal, how to send the parameters is managed automatically.
    * */
   params?: T;
}
/**
 * Axios request wrapper with error handling.
 * @param options Axios request options, example: {url: "search/users"}
 */
export async function httpRequest<Response, Parameters = any>(
   options: AxiosRequestConfigExtended<Parameters>,
): Promise<HttpRequestResponse<Response>> {
   const client: AxiosInstance = axios.create({});

   let promiseResolve: (
      value?: HttpRequestResponse<Response> | PromiseLike<HttpRequestResponse<Response>>,
   ) => void = null;
   const resultPromise: Promise<HttpRequestResponse<Response>> = new Promise(resolve => {
      promiseResolve = resolve;
   });

   if (options.params) {
      if (options.method === "GET") {
         options.url += "?" + stringify(options.params);
      }

      if (options.method === "POST") {
         options.data = options.params;
      }
   }

   try {
      const response: AxiosResponse<Response> = await client(options);
      promiseResolve({ success: true, content: response.data });
   } catch (error) {
      if (error.response) {
         // Request was made but server responded with something
         // other than 2xx
         promiseResolve({
            success: false,
            error: { message: tryToGetErrorMessage(error), code: error.response.status },
         });
      } else {
         // Something else happened while setting up the request
         // triggered the error
         promiseResolve({ success: false, error: { message: tryToGetErrorMessage(error), code: 0 } });
      }
   }

   return resultPromise;
}
