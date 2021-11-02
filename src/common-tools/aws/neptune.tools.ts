import { BaseContext } from "koa";
import { getCredentialsHash } from "../../components/admin/tools/validateAdminCredentials";
import {
   ExportDatabaseResponse,
   ImportDatabasePostParams,
} from "../../shared-tools/endpoints-interfaces/admin";
import { createZipFileFromDirectory, deleteFolder } from "../files-tools/files-tools";
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

   const loaderEndpoint = process.env.DATABASE_URL.replace("wss://", "").replace(":8182/gremlin", "");

   var commandStr = `java -jar vendor/neptune-export/neptune-export.jar export-pg -e ${loaderEndpoint} -d admin-uploads/db ${
      process.env.AWS_CLONE_CLUSTER_ON_BACKUP === "true" ? "--clone-cluster" : ""
   }`;

   commandResponse = await executeSystemCommand(commandStr);

   await createZipFileFromDirectory("admin-uploads/db", "admin-uploads/db.zip");
   deleteFolder("admin-uploads/db");

   return {
      commandResponse,
      folder: `api/admin-uploads/db.zip?hash=${await getCredentialsHash()}`,
   };
}
