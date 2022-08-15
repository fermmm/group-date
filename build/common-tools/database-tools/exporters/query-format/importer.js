"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importDatabaseContentFromQueryFile = void 0;
const path = require("path");
const tryToGetErrorMessage_1 = require("../../../httpRequest/tools/tryToGetErrorMessage");
const database_manager_1 = require("../../database-manager");
/**
 * Loads database content provided in a file that contains queries separated by a line break.
 */
async function importDatabaseContentFromQueryFile(props) {
    const { fileContent, fileNameForLogs } = props;
    let responseText = "";
    let successfulQueries = 0;
    let failedQueries = 0;
    if (fileNameForLogs != null) {
        responseText += `\n\nFile: ${path.basename(fileNameForLogs)}\n`;
    }
    const queries = fileContent.split(/\r\n|\r|\n/g).filter(query => query.trim().length > 0);
    for (const query of queries) {
        try {
            await (0, database_manager_1.sendQueryAsString)(query);
            successfulQueries++;
        }
        catch (e) {
            const error = (0, tryToGetErrorMessage_1.tryToGetErrorMessage)(e);
            responseText += error + "\n";
            failedQueries++;
        }
    }
    responseText += `Finished. Successful queries: ${successfulQueries}. Failed queries: ${failedQueries}`;
    return responseText;
}
exports.importDatabaseContentFromQueryFile = importDatabaseContentFromQueryFile;
//# sourceMappingURL=importer.js.map