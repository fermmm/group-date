"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportNeptuneDatabase = exports.importNeptuneDatabase = void 0;
const validateAdminCredentials_1 = require("../../components/admin/tools/validateAdminCredentials");
const files_tools_1 = require("../files-tools/files-tools");
const httpRequest_1 = require("../httpRequest/httpRequest");
const process_tools_1 = require("../process/process-tools");
async function importNeptuneDatabase(params, ctx) {
    var _a, _b, _c;
    const { fileName } = params;
    if (((_a = process.env.AWS_BUCKET_NAME) !== null && _a !== void 0 ? _a : "").length < 2) {
        ctx.throw(400, "AWS_BUCKET_NAME is not set in the .env file");
        return;
    }
    if (((_b = process.env.AWS_CSV_IAM_ROLE_ARN) !== null && _b !== void 0 ? _b : "").length < 2) {
        ctx.throw(400, "AWS_CSV_IAM_ROLE_ARN is not set in the .env file");
        return;
    }
    if (((_c = process.env.AWS_REGION) !== null && _c !== void 0 ? _c : "").length < 2) {
        ctx.throw(400, "AWS_REGION is not set in the .env file");
        return;
    }
    const loaderEndpoint = process.env.DATABASE_URL.replace("gremlin", "loader").replace("wss:", "https:");
    const requestParams = {
        source: `s3://${process.env.AWS_BUCKET_NAME}/${fileName}`,
        format: "csv",
        iamRoleArn: process.env.AWS_CSV_IAM_ROLE_ARN,
        region: process.env.AWS_REGION,
        queueRequest: "TRUE",
    };
    const response = await (0, httpRequest_1.httpRequest)({ url: loaderEndpoint, method: "POST", params: requestParams });
    return { request: { url: loaderEndpoint, ...requestParams }, response };
}
exports.importNeptuneDatabase = importNeptuneDatabase;
async function exportNeptuneDatabase(ctx) {
    var _a, _b;
    if (((_a = process.env.AWS_BUCKET_NAME) !== null && _a !== void 0 ? _a : "").length < 2) {
        ctx.throw(400, "AWS_BUCKET_NAME is not set in the .env file");
        return;
    }
    if (((_b = process.env.AWS_REGION) !== null && _b !== void 0 ? _b : "").length < 2) {
        ctx.throw(400, "AWS_REGION is not set in the .env file");
        return;
    }
    let commandResponse = await (0, process_tools_1.executeSystemCommand)("test -e vendor/neptune-export/neptune-export.jar && echo true || echo false");
    if (commandResponse === "false") {
        commandResponse = await (0, process_tools_1.executeSystemCommand)("wget https://s3.amazonaws.com/aws-neptune-customer-samples/neptune-export/bin/neptune-export.jar -P vendor/neptune-export");
    }
    commandResponse = await (0, process_tools_1.executeSystemCommand)("test -e vendor/neptune-export/neptune-export.jar && echo true || echo false");
    if (commandResponse === "false") {
        ctx.throw(500, "Failed to download Neptune export jar file");
        return;
    }
    const loaderEndpoint = process.env.DATABASE_URL.replace("wss://", "").replace(":8182/gremlin", "");
    const commandStr = `java -jar vendor/neptune-export/neptune-export.jar export-pg -e ${loaderEndpoint} -d admin-uploads/db ${process.env.AWS_CLONE_CLUSTER_ON_BACKUP === "true" ? "--clone-cluster" : ""}`;
    commandResponse = await (0, process_tools_1.executeSystemCommand)(commandStr);
    /*
     * The exporter creates a folder whose name is a hash: "admin-uploads/db/abc12345678/nodes".
     * We need to get rid of that hash named folder in order to make more simple the next commands.
     *
     * 1. The /* in the "cd" path goes to the first folder found, this is required because we don't know the name of the folder.
     * 2. mv * ../ moves all the files one level up
     * 3. folderName=$(basename "$PWD") saves the folder name, we need to save it for later becase removing the current folder is not possible
     * 4. cd .. We leave the current folder
     * 5. rm -r $folderName Removes the empty hash named folder
     * */
    commandResponse = await (0, process_tools_1.executeSystemCommand)(`cd admin-uploads/db/* && mv * ../ && folderName=$(basename "$PWD") && cd .. && rm -r $folderName`);
    const exportedFolderPath = "admin-uploads/db";
    // Create .gremlin files along with the .csv files. These .gremlin files contains the same data as the .csv files in a query format. Useful to import it in localhost using gremlin-server
    commandResponse += await (0, process_tools_1.executeSystemCommand)(`for file in ${exportedFolderPath}/nodes/*.csv; do python3.8 vendor/csv-gremlin/csv-gremlin.py $file >> ${exportedFolderPath}/nodes/$(basename $file .csv).gremlin; done`);
    // Again for the edges.
    commandResponse += await (0, process_tools_1.executeSystemCommand)(`for file in ${exportedFolderPath}/edges/*.csv; do python3.8 vendor/csv-gremlin/csv-gremlin.py $file >> ${exportedFolderPath}/edges/$(basename $file .csv).gremlin; done`);
    await (0, files_tools_1.createZipFileFromDirectory)(exportedFolderPath, "admin-uploads/db.zip");
    // deleteFolder(exportedFolderPath);
    return {
        commandResponse,
        folder: `api/admin-uploads/db.zip?hash=${(0, validateAdminCredentials_1.getCredentialsHash)()}`,
    };
}
exports.exportNeptuneDatabase = exportNeptuneDatabase;
//# sourceMappingURL=neptune-tools.js.map