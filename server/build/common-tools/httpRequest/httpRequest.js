"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequest = void 0;
const axios_1 = require("axios");
const query_string_1 = require("query-string");
const tryToGetErrorMessage_1 = require("./tools/tryToGetErrorMessage");
/**
 * Axios request wrapper with error handling.
 * @param options Axios request options, example: {url: "search/users"}
 */
async function httpRequest(options) {
    const client = axios_1.default.create({});
    let promiseResolve = null;
    const resultPromise = new Promise(resolve => {
        promiseResolve = resolve;
    });
    if (options.params) {
        if (options.method === "GET") {
            options.url += "?" + (0, query_string_1.stringify)(options.params);
        }
        if (options.method === "POST") {
            options.data = options.params;
        }
    }
    try {
        const response = await client(options);
        promiseResolve({ success: true, content: response.data });
    }
    catch (error) {
        if (error.response) {
            // Request was made but server responded with something
            // other than 2xx
            promiseResolve({
                success: false,
                error: { message: (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error), code: error.response.status },
            });
        }
        else {
            // Something else happened while setting up the request
            // triggered the error
            promiseResolve({ success: false, error: { message: (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(error), code: 0 } });
        }
    }
    return resultPromise;
}
exports.httpRequest = httpRequest;
//# sourceMappingURL=httpRequest.js.map