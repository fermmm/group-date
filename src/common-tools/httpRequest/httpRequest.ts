import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { HttpRequestResponse } from '../typing-tools/typing-tools';

/**
 * Axios request wrapper with error handling.
 * @param options Axios request options, example: {url: "search/users"}
 */
export async function httpRequest<T>(options: AxiosRequestConfig): Promise<HttpRequestResponse<T>> {
   const client: AxiosInstance = axios.create({});

   let promiseResolve: (value?: HttpRequestResponse<T> | PromiseLike<HttpRequestResponse<T>>) => void = null;
   const resultPromise: Promise<HttpRequestResponse<T>> = new Promise(resolve => {
      promiseResolve = resolve;
   });

   try {
      const response: AxiosResponse<T> = await client(options);
      promiseResolve({success: true, content: response.data});
   } catch (error) {
      if (error.response) {
         // Request was made but server responded with something
         // other than 2xx
         promiseResolve({success: false, error: {message: error.response.data?.error?.message, code: error.response.status}})
      } else {
         // Something else happened while setting up the request
         // triggered the error
         promiseResolve({success: false, error: {message: error.message, code: 0}});
      }
   }

   return resultPromise;
}
