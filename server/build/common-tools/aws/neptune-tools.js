"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDatabaseContentFromNeptune = exports.importDatabaseContentXmlToNeptune = exports.importDatabaseContentCsvToNeptune = void 0;
const path = require("path");
const validateAdminCredentials_1 = require("../../components/admin/tools/validateAdminCredentials");
const files_tools_1 = require("../files-tools/files-tools");
const httpRequest_1 = require("../httpRequest/httpRequest");
const tryToGetErrorMessage_1 = require("../httpRequest/tools/tryToGetErrorMessage");
const process_tools_1 = require("../process/process-tools");
const s3_tools_1 = require("./s3-tools");
async function importDatabaseContentCsvToNeptune(params, ctx) {
    var _a, _b, _c;
    const { filePaths } = params;
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
    const sentParams = [];
    const responses = [];
    for (const filePath of filePaths) {
        const requestParams = {
            source: `s3://${process.env.AWS_BUCKET_NAME}/${filePath}`,
            format: "csv",
            iamRoleArn: process.env.AWS_CSV_IAM_ROLE_ARN,
            region: process.env.AWS_REGION,
            queueRequest: "TRUE",
        };
        sentParams.push(requestParams);
        responses.push(await (0, httpRequest_1.httpRequest)({ url: loaderEndpoint, method: "POST", params: requestParams }));
    }
    return { request: { url: loaderEndpoint, sentParams }, responses };
}
exports.importDatabaseContentCsvToNeptune = importDatabaseContentCsvToNeptune;
async function importDatabaseContentXmlToNeptune(filePath, ctx) {
    let response = "";
    try {
        response += `Saving S3 file ${filePath} to disk \n`;
        await (0, s3_tools_1.downloadS3FileToDisk)(filePath, filePath);
        response += `Converting xml file into csv files \n`;
        response += await (0, process_tools_1.executeSystemCommand)(`./vendor/graphml2csv/graphml2csv.py -i ${filePath}`);
        response += `Uploading CSV files to S3 \n`;
        const nodesFilePath = `${path.dirname(filePath)}/${path.basename(filePath).split(".")[0]}-nodes.csv`;
        const edgesFilePath = `${path.dirname(filePath)}/${path.basename(filePath).split(".")[0]}-edges.csv`;
        await (0, s3_tools_1.uploadFileToS3)({ localFilePath: nodesFilePath, s3TargetPath: nodesFilePath });
        await (0, s3_tools_1.uploadFileToS3)({ localFilePath: edgesFilePath, s3TargetPath: edgesFilePath });
        response += `Calling CSV importer for nodes file\n`;
        response +=
            JSON.stringify(await importDatabaseContentCsvToNeptune({ filePaths: [nodesFilePath] }, ctx)) + "\n";
        response += `Calling CSV importer for edges file\n`;
        response +=
            JSON.stringify(await importDatabaseContentCsvToNeptune({ filePaths: [edgesFilePath] }, ctx)) + "\n";
        response += "Cleaning files on EC2 \n";
        (0, files_tools_1.deleteFolder)(path.dirname(filePath));
        response += "Done. Note: The import process is finished but the changes may take some time. \n";
        return response;
    }
    catch (e) {
        return `${response} \n Error: ${(0, tryToGetErrorMessage_1.tryToGetErrorMessage)(e)}`;
    }
}
exports.importDatabaseContentXmlToNeptune = importDatabaseContentXmlToNeptune;
async function exportDatabaseContentFromNeptune(props) {
    var _a, _b;
    const { targetFilePath, cloneClusterBeforeBackup } = props;
    const tempFilesFolderPath = "admin-uploads/db";
    if (((_a = process.env.AWS_BUCKET_NAME) !== null && _a !== void 0 ? _a : "").length < 2) {
        return Promise.reject("AWS_BUCKET_NAME is not set in the .env file");
    }
    if (((_b = process.env.AWS_REGION) !== null && _b !== void 0 ? _b : "").length < 2) {
        return Promise.reject("AWS_REGION is not set in the .env file");
    }
    let commandResponse;
    /**
     * This commented code avoids downloading the neptune-export.jar file if it's already present,
     * but I commented it because it caused a problem: it was throwing an error and the solution was
     * to download a new version of the file (from the same URL) I commented this code to avoid this
     * problem if happens again in the future. Currently the the file will be re-downloaded each time an
     * export is done, it adds to the time it takes to export but it's not a big deal.
     */
    // commandResponse = await executeSystemCommand(
    //    "test -e vendor/neptune-export/neptune-export.jar && echo true || echo false",
    // );
    // if (commandResponse === "false") {
    commandResponse = await (0, process_tools_1.executeSystemCommand)("wget https://s3.amazonaws.com/aws-neptune-customer-samples/neptune-export/bin/neptune-export.jar -P vendor/neptune-export");
    // }
    commandResponse = await (0, process_tools_1.executeSystemCommand)("test -e vendor/neptune-export/neptune-export.jar && echo true || echo false");
    if (commandResponse === "false") {
        return Promise.reject("Failed to download Neptune export jar file");
    }
    const loaderEndpoint = process.env.DATABASE_URL.replace("wss://", "").replace(":8182/gremlin", "");
    const commandStr = `java -jar vendor/neptune-export/neptune-export.jar export-pg -e ${loaderEndpoint} -d ${tempFilesFolderPath} ${cloneClusterBeforeBackup ? "--clone-cluster" : ""}`;
    commandResponse = await (0, process_tools_1.executeSystemCommand)(commandStr);
    /*
     * The exporter creates a folder whose name is a hash: "admin-uploads/db/abc12345678/nodes".
     * We need to get rid of that hash named folder in order to make more simple the next commands.
     *
     * 1. "cd admin-uploads/db/*" Goes to the first folder found, this is required because we don't know the name of the folder.
     * 2. "mv * ../" moves all the files one level up
     * 3. "folderName=$(basename "$PWD")" saves the folder name, we need to save it for later becase removing the current folder is not possible
     * 4. "cd .." We leave the current folder so we can remove it
     * 5. "rm -r $folderName" Removes the now empty hash named folder
     * */
    commandResponse += await (0, process_tools_1.executeSystemCommand)(`cd ${tempFilesFolderPath}/* && mv * ../ && folderName=$(basename "$PWD") && cd .. && rm -r $folderName`);
    // Crete the folder where we are going to put the .gremlin format files
    await (0, process_tools_1.executeSystemCommand)(`mkdir -p ${tempFilesFolderPath}/nodes/gremlin`);
    await (0, process_tools_1.executeSystemCommand)(`mkdir -p ${tempFilesFolderPath}/edges/gremlin`);
    // Create .gremlin files along with the .csv files. These .gremlin files contains the same data as the .csv files in a query format. Useful to import it in localhost using gremlin-server
    commandResponse += await (0, process_tools_1.executeSystemCommand)(`for file in ${tempFilesFolderPath}/nodes/*.csv; do python3.8 vendor/csv-gremlin/csv-gremlin.py $file >> ${tempFilesFolderPath}/nodes/gremlin/$(basename $file .csv).gremlin; done`);
    // Again for the edges.
    commandResponse += await (0, process_tools_1.executeSystemCommand)(`for file in ${tempFilesFolderPath}/edges/*.csv; do python3.8 vendor/csv-gremlin/csv-gremlin.py $file >> ${tempFilesFolderPath}/edges/gremlin/$(basename $file .csv).gremlin; done`);
    await (0, files_tools_1.createZipFileFromDirectory)(tempFilesFolderPath, targetFilePath);
    (0, files_tools_1.deleteFolder)(tempFilesFolderPath);
    return {
        commandResponse,
        folder: `api/${targetFilePath}?hash=${(0, validateAdminCredentials_1.getCredentialsHash)()}`,
    };
}
exports.exportDatabaseContentFromNeptune = exportDatabaseContentFromNeptune;
//# sourceMappingURL=neptune-tools.js.map