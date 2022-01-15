import { BaseContext } from "koa";
import * as path from "path";
import { getCredentialsHash } from "../../components/admin/tools/validateAdminCredentials";
import { ExportDatabaseResponse } from "../../shared-tools/endpoints-interfaces/admin";
import { createZipFileFromDirectory, deleteFolder } from "../files-tools/files-tools";
import { httpRequest } from "../httpRequest/httpRequest";
import { tryToGetErrorMessage } from "../httpRequest/tools/tryToGetErrorMessage";
import { executeSystemCommand } from "../process/process-tools";
import { saveS3FileToDisk, uploadFileToS3 } from "./s3-tools";

export async function importDatabaseContentCsvToNeptune(params: { filePaths: string[] }, ctx: BaseContext) {
   const { filePaths } = params;

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
      responses.push(await httpRequest({ url: loaderEndpoint, method: "POST", params: requestParams }));
   }

   return { request: { url: loaderEndpoint, sentParams }, responses };
}

export async function importDatabaseContentXmlToNeptune(filePath: string, ctx: BaseContext) {
   let response = "";
   try {
      response += `Saving S3 file ${filePath} to disk \n`;
      await saveS3FileToDisk(filePath, filePath);

      response += `Converting xml file into csv files \n`;
      response += await executeSystemCommand(`./vendor/graphml2csv/graphml2csv.py -i ${filePath}`);

      response += `Uploading CSV files to S3 \n`;
      const nodesFilePath = `${path.dirname(filePath)}/${path.basename(filePath).split(".")[0]}-nodes.csv`;
      const edgesFilePath = `${path.dirname(filePath)}/${path.basename(filePath).split(".")[0]}-edges.csv`;
      await uploadFileToS3({ localFilePath: nodesFilePath, s3TargetPath: nodesFilePath });
      await uploadFileToS3({ localFilePath: edgesFilePath, s3TargetPath: edgesFilePath });

      response += `Calling CSV importer for nodes file\n`;
      response +=
         JSON.stringify(await importDatabaseContentCsvToNeptune({ filePaths: [nodesFilePath] }, ctx)) + "\n";
      response += `Calling CSV importer for edges file\n`;
      response +=
         JSON.stringify(await importDatabaseContentCsvToNeptune({ filePaths: [edgesFilePath] }, ctx)) + "\n";

      response += "Cleaning files on EC2 \n";
      deleteFolder(path.dirname(filePath));

      response += "Done. Note: The import process is finished but the changes may take some time. \n";
      return response;
   } catch (e) {
      return `${response} \n Error: ${tryToGetErrorMessage(e)}`;
   }
}

export async function exportDatabaseContentFromNeptune(ctx: BaseContext): Promise<ExportDatabaseResponse> {
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

   const commandStr = `java -jar vendor/neptune-export/neptune-export.jar export-pg -e ${loaderEndpoint} -d admin-uploads/db ${
      process.env.AWS_CLONE_CLUSTER_ON_BACKUP === "true" ? "--clone-cluster" : ""
   }`;

   commandResponse = await executeSystemCommand(commandStr);

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
   commandResponse += await executeSystemCommand(
      `cd admin-uploads/db/* && mv * ../ && folderName=$(basename "$PWD") && cd .. && rm -r $folderName`,
   );

   const exportedFolderPath = "admin-uploads/db";

   // Crete the folder where we are going to put the .gremlin format files
   await executeSystemCommand(`mkdir -p ${exportedFolderPath}/nodes/gremlin`);
   await executeSystemCommand(`mkdir -p ${exportedFolderPath}/edges/gremlin`);

   // Create .gremlin files along with the .csv files. These .gremlin files contains the same data as the .csv files in a query format. Useful to import it in localhost using gremlin-server
   commandResponse += await executeSystemCommand(
      `for file in ${exportedFolderPath}/nodes/*.csv; do python3.8 vendor/csv-gremlin/csv-gremlin.py $file >> ${exportedFolderPath}/nodes/gremlin/$(basename $file .csv).gremlin; done`,
   );
   // Again for the edges.
   commandResponse += await executeSystemCommand(
      `for file in ${exportedFolderPath}/edges/*.csv; do python3.8 vendor/csv-gremlin/csv-gremlin.py $file >> ${exportedFolderPath}/edges/gremlin/$(basename $file .csv).gremlin; done`,
   );

   await createZipFileFromDirectory(exportedFolderPath, "admin-uploads/db.zip");
   deleteFolder(exportedFolderPath);

   return {
      commandResponse,
      folder: `api/admin-uploads/db.zip?hash=${getCredentialsHash()}`,
   };
}
