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
    var commandStr = `java -jar vendor/neptune-export/neptune-export.jar export-pg -e ${loaderEndpoint} -d admin-uploads/db ${process.env.AWS_CLONE_CLUSTER_ON_BACKUP === "true" ? "--clone-cluster" : ""}`;
    commandResponse = await (0, process_tools_1.executeSystemCommand)(commandStr);
    await (0, files_tools_1.createZipFileFromDirectory)("admin-uploads/db", "admin-uploads/db.zip");
    (0, files_tools_1.deleteFolder)("admin-uploads/db");
    return {
        commandResponse,
        folder: `api/admin-uploads/db.zip?hash=${await (0, validateAdminCredentials_1.encryptCredentials)({
            user: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASSWORD,
        })}`,
    };
}
exports.exportNeptuneDatabase = exportNeptuneDatabase;
//# sourceMappingURL=neptune.tools.js.map