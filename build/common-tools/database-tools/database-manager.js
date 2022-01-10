"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAllDatabaseContent = exports.importDatabaseContentFromQueryFile = exports.importDatabaseContentFromFile = exports.exportDatabaseContentToFile = exports.sendQueryAsString = exports.sendQuery = exports.waitForDatabase = exports.cardinality = exports.t = exports.scope = exports.id = exports.column = exports.order = exports.P = exports.TextP = exports.withOptions = exports.__ = exports.g = exports.databaseUrl = void 0;
const gremlin = require("gremlin");
const path = require("path");
const js_tools_1 = require("../js-tools/js-tools");
const configurations_1 = require("../../configurations");
const process_tools_1 = require("../process/process-tools");
const files_tools_1 = require("../files-tools/files-tools");
const tryToGetErrorMessage_1 = require("../httpRequest/tools/tryToGetErrorMessage");
exports.databaseUrl = (0, process_tools_1.isProductionMode)() ? process.env.DATABASE_URL : process.env.DATABASE_URL_DEVELOPMENT;
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
exports.g = traversal().withRemote(new DriverRemoteConnection(exports.databaseUrl, {}));
exports.__ = gremlin.process.statics;
exports.withOptions = gremlin.process.withOptions;
exports.TextP = gremlin.process.TextP;
exports.P = gremlin.process.P;
exports.order = gremlin.process.order;
exports.column = gremlin.process.column;
exports.id = gremlin.process.t.id;
exports.scope = gremlin.process.scope;
exports.t = gremlin.process.t;
exports.cardinality = gremlin.process.cardinality;
/**
 * The promise of this function resolves only when database responds to a simple query
 *
 *  @param silent Default = false. When true does not send any console.log()
 */
async function waitForDatabase() {
    let resolvePromise;
    const result = new Promise(r => (resolvePromise = r));
    let promiseSolved = false;
    console.log(`Database URL is: ${exports.databaseUrl}`);
    console.log("Waiting for database...");
    const interval = setInterval(() => {
        checkDatabase();
    }, 1000);
    const checkDatabase = () => {
        exports.g.inject(0)
            .toList()
            .then(() => {
            if (!promiseSolved) {
                promiseSolved = true;
                console.log("✓ Database responding!");
                clearInterval(interval);
                resolvePromise();
            }
        })
            .catch(error => { });
    };
    checkDatabase();
    return result;
}
exports.waitForDatabase = waitForDatabase;
/**
 * Executes the query promise and retries if returns an error. If still returns an error after some time then
 * returns the error of the last try.
 * This is required because of the "ConcurrentModificationException" internal error of a Gremlin database,
 * this error happens because the database accepts more requests even when did not finish a modification of
 * a previous request, so when a request tries to write or read the same information still being saved by a
 * previous request there is a "collision" that generates this error and one or more retries are needed to
 * solve the problem, it uses the "Exponential Backoff" retry approach.
 *
 * @param query The query wrapped into a arrow function like this: retryOnError(() => g.V().toList())
 * @param logResult Default = false. Executes a console.log() with the query response that is configured to show more information than the default console.log()
 */
async function sendQuery(query, logResult = false) {
    let result;
    try {
        result = await query();
    }
    catch (error) {
        try {
            if (configurations_1.REPORT_DATABASE_RETRYING) {
                consoleLog("Database retrying");
            }
            // Try again without waiting, maybe a simple retry is enough
            result = await query();
        }
        catch (error) {
            try {
                if (configurations_1.REPORT_DATABASE_RETRYING) {
                    consoleLog("Database retrying");
                }
                // Try again repeatedly waiting more time on each retry
                result = await (0, js_tools_1.retryPromise)(query, configurations_1.MAX_TIME_TO_WAIT_ON_DATABASE_RETRY, 1);
            }
            catch (error) {
                // If the amount of retries hit the limit and returned an error log the error
                console.log(`Error from database, all retries failed: ${error}`);
                console.log(error);
                throw error;
            }
        }
    }
    if (logResult) {
        consoleLog(result);
    }
    return result;
}
exports.sendQuery = sendQuery;
/**
 * Sends a query that is in a string format, eg: "g.V().toList()"
 */
async function sendQueryAsString(query) {
    const client = new gremlin.driver.Client(exports.databaseUrl, {
        traversalSource: "g",
        mimeType: "application/json",
    });
    // AWS Neptune workaround
    query = query.replace("g.V", "g.inject(0).V");
    try {
        return await client.submit(query, {});
    }
    catch (error) {
        console.log("");
        console.log(`Error sending query as a string, query: ${query}`);
        throw error;
    }
}
exports.sendQueryAsString = sendQueryAsString;
/**
 * @param path File extension should be xml so gremlin knows it should save with the GraphML format (the most popular and supported).Example: "graph.xml"
 */
async function exportDatabaseContentToFile(path) {
    await exports.g.io(path).write().iterate();
}
exports.exportDatabaseContentToFile = exportDatabaseContentToFile;
async function importDatabaseContentFromFile(path) {
    await exports.g.io(path).read().iterate();
}
exports.importDatabaseContentFromFile = importDatabaseContentFromFile;
/**
 * Loads database content provided in a file that contains queries separated by a line break.
 */
async function importDatabaseContentFromQueryFile(filePaths) {
    let responseText = "Database import in .gremlin format";
    let successfulQueries = 0;
    let failedQueries = 0;
    for (const filePath of filePaths) {
        const fileContent = (0, files_tools_1.getFileContent)(filePath);
        const queries = fileContent.split(/\r\n|\r|\n/g).filter(query => query.trim().length > 0);
        responseText += `\n\nFile: ${path.basename(filePath)}\n`;
        for (const query of queries) {
            try {
                await sendQueryAsString(query);
                successfulQueries++;
            }
            catch (e) {
                const error = (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(e);
                responseText += error + "\n";
                failedQueries++;
            }
        }
    }
    responseText += `Finished. Successful queries: ${successfulQueries}. Failed queries: ${failedQueries}`;
    return responseText;
}
exports.importDatabaseContentFromQueryFile = importDatabaseContentFromQueryFile;
async function removeAllDatabaseContent() {
    await sendQuery(() => exports.g.V().drop().iterate());
}
exports.removeAllDatabaseContent = removeAllDatabaseContent;
//# sourceMappingURL=database-manager.js.map