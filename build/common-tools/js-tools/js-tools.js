"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._consoleLog = exports.shuffleArray = exports.retryPromise = exports.executePromises = exports.divideArrayCallback = exports.numberChunksCallback = exports.objectsContentIsEqual = exports.time = void 0;
const util = require("util");
/**
 * Wraps a setTimeout into this async function to be used with "async await" syntax.
 *
 * @param timeInMilliseconds Time to pass to setTimeout
 * @param idGetter Default = null. This function will be executed passing the id of the setTimeout in case you need to cancel it.
 */
async function time(timeInMilliseconds, idGetter = null) {
    return new Promise(resolve => {
        if (idGetter == null) {
            setTimeout(resolve, timeInMilliseconds);
        }
        else {
            idGetter(setTimeout(resolve, timeInMilliseconds));
        }
    });
}
exports.time = time;
/**
 * Performs a shallow comparison of the values of 2 objects using the strict equality operator.
 * Different order of keys does not affect the result.
 */
function objectsContentIsEqual(object1, object2) {
    // If the reference is the same the objects are equal.
    if (object1 === object2) {
        return true;
    }
    // If one of the objects is null and the other undefined they are not equal
    if ((object1 === null && object2 === undefined) || (object2 === null && object1 === undefined)) {
        return false;
    }
    // If one of the objects is null or undefined and the other not they are not equal
    if ((object1 == null && object2 != null) || (object2 == null && object1 != null)) {
        return false;
    }
    // Now at this point we are sure that none of both objects are null or undefined so we can compare the elements
    const object1Keys = Object.keys(object1 !== null && object1 !== void 0 ? object1 : {});
    const object2Keys = Object.keys(object2 !== null && object2 !== void 0 ? object2 : {});
    if (object1Keys.length !== object2Keys.length) {
        return false;
    }
    for (const key of object1Keys) {
        if (!object2.hasOwnProperty(key)) {
            return false;
        }
        if (object1[key] !== object2[key]) {
            return false;
        }
    }
    return true;
}
exports.objectsContentIsEqual = objectsContentIsEqual;
/**
 * Divides a number called "total" into chunks with the desired size and executes a callback
 * for each chunk, the callback sends the current chunk size.
 * For example:
 * total = 106 and chunkSize = 50
 * will call the callback 3 times callback(50), callback(50) and callback(6)
 * The callback can be async and one will be executed when the previous finished successfully.
 * This tool can be useful to divide workload.
 */
async function numberChunksCallback(total, chunkSize, callback) {
    if (total === 0) {
        return;
    }
    if (total <= chunkSize) {
        await callback(total);
        return;
    }
    const chunksAmount = Math.ceil(total / chunkSize);
    let unitsDone = 0;
    for (let i = 0; i < chunksAmount; i++) {
        if (i < chunksAmount - 1) {
            // All chunks except the last one has the chunkSize
            unitsDone += chunkSize;
            await callback(chunkSize);
            continue;
        }
        // In the last call send the remaining units
        await callback(total - unitsDone);
    }
}
exports.numberChunksCallback = numberChunksCallback;
/**
 * Divides an array into smaller chunks arrays and executes a provided callback for each chunk passing the chunk
 * in the callback. The callback can be async. It's useful to call a resource multiple times dividing the workload.
 */
async function divideArrayCallback(array, chunkSize, callback) {
    let i = 0;
    await numberChunksCallback(array.length, chunkSize, async (currentChunk) => {
        await callback(array.slice(i, i + currentChunk));
        i += currentChunk;
    });
}
exports.divideArrayCallback = divideArrayCallback;
/**
 * Executes an array of promises one after the other unless "simultaneously" parameter is set to true
 * The promises must be wrapped in a function.
 *
 * @param promises An array of promises wrapped in a function
 * @param simultaneously  default = false. If this is true it only calls Promise.all(promises)
 */
async function executePromises(promises, simultaneously = false) {
    if (simultaneously === true) {
        return await Promise.all(promises.map(pf => pf()));
    }
    const result = [];
    for (const promise of promises) {
        result.push(await promise());
    }
    return result;
}
exports.executePromises = executePromises;
/**
 * Executes an async function. If the promise returns error waits some time and try again.
 * You can configure the time between retries and the maximum time spent retrying.
 * Returns the first non-error response. If it's still failing when reaching the maximum time
 * of retries then returns the promise error.
 * The time between retries is not constant, it will double the time on each retry, because
 * if a promise returns error because the resource is busy it means we have to wait more time
 * and not spam the resource. This pattern is called "Exponential Backoff".
 *
 * @param promise The async function to try
 * @param maxTimeOnARetry Time in milliseconds. Default = 4096. On each retry the wait time will be multiplied by 2, when this multiplication reaches the number specified in this parameter then returns the error returned on the last try.
 * @param startingWaitTime Time in milliseconds. Default = 1. This time will be multiplied by 2 on each retry, when this multiplication reaches maxTimeOnARetry parameter then returns the error returned on the last try.
 */
async function retryPromise(promise, maxTimeOnARetry = 4096, startingWaitTime = 1) {
    await time(startingWaitTime);
    try {
        return await promise();
    }
    catch (error) {
        if (startingWaitTime < maxTimeOnARetry) {
            return await retryPromise(promise, maxTimeOnARetry, startingWaitTime * 2);
        }
        else {
            return await promise();
        }
    }
}
exports.retryPromise = retryPromise;
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
exports.shuffleArray = shuffleArray;
/**
 * Calls console.log() with colors and more levels of data (without showing [Object])
 */
function _consoleLog(obj) {
    console.log(util.inspect(obj, false, null, true));
}
exports._consoleLog = _consoleLog;
//# sourceMappingURL=js-tools.js.map