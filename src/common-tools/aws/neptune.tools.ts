import { BaseContext } from "koa";
import {
   ExportDatabaseResponse,
   ImportDatabasePostParams,
} from "../../shared-tools/endpoints-interfaces/admin";
import { databaseUrl } from "../database-tools/database-manager";
import { httpRequest } from "../httpRequest/httpRequest";
import { executeSystemCommand } from "../process/process-tools";

export async function importNeptuneDatabase(params: ImportDatabasePostParams, ctx: BaseContext) {
   const { fileName } = params;

   if ((process.env.AWS_BUCKET_NAME ?? "").length < 2) {
      ctx.throw(400, "AWS_BUCKET_NAME is not set in the .env file");
      return;
   }

   if ((process.env.AWS_CSV_IAM_ROLE_ARN ?? "").length < 2) {
      ctx.throw(400, "AWS_CSV_IAM_ROLE_ARN is not set in the .env file");
      return;
   }

   if ((process.env.AWS_REGION ?? "").length < 2) {
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

   const response = await httpRequest({ url: loaderEndpoint, method: "POST", params: requestParams });

   return { request: { url: loaderEndpoint, ...requestParams }, response };
}

export async function exportNeptuneDatabase(ctx: BaseContext): Promise<ExportDatabaseResponse> {
   if ((process.env.AWS_BUCKET_NAME ?? "").length < 2) {
      ctx.throw(400, "AWS_BUCKET_NAME is not set in the .env file");
      return;
   }

   if ((process.env.AWS_REGION ?? "").length < 2) {
      ctx.throw(400, "AWS_REGION is not set in the .env file");
      return;
   }

   let commandResponse = await executeSystemCommand(
      "test -e vendor/neptune-export/neptune-export.jar && echo true || echo false",
   );

   if (commandResponse === "false") {
      commandResponse = await executeSystemCommand(
         "wget https://s3.amazonaws.com/aws-neptune-customer-samples/neptune-export/bin/neptune-export.jar -P vendor/neptune-export",
      );
   }

   commandResponse = await executeSystemCommand(
      "test -e vendor/neptune-export/neptune-export.jar && echo true || echo false",
   );

   if (commandResponse === "false") {
      ctx.throw(500, "Failed to download Neptune export jar file");
      return;
   }

   const s3FolderName = "db-export";

   const commandJson = {
      params: {
         endpoint: databaseUrl,
         /**
          * If this is set to true, the database will be cloned for data consistency.
          * It takes a long time to finish and the export button looks like it's stuck.
          * Also the clone is supposed to be deleted after finish but if the process is
          * interrupted or fails you have to delete it manually.
          * For productivity when testing it's recommended to be set as false.
          */
         cloneCluster: false,
         profile: "neptune_ml",
      },
      outputS3Path: `s3://${process.env.AWS_BUCKET_NAME}/${s3FolderName}`,
   };

   var commandStr = `SERVICE_REGION=${
      process.env.AWS_REGION
   } java -jar vendor/neptune-export/neptune-export.jar nesvc --root-path admin-uploads/${s3FolderName} --json '${JSON.stringify(
      commandJson,
   )}'`;

   commandResponse = await executeSystemCommand(commandStr);

   return { commandResponse, folder: s3FolderName };
}
