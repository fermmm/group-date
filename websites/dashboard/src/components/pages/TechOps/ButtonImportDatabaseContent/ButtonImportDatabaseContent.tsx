import React, { FC, useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFilePicker } from "use-file-picker";
import { exportDbRequest, importDbRequest, uploadAdminFiles } from "../../../../api/server/techOps";
import { tryToGetErrorMessage } from "../../../../api/tools/tryToGetErrorMessage";
import ResponseText from "../ResponseText/ResponseText";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";

const ButtonImportDatabaseContent: FC = props => {
   const [loading, setLoading] = useState<boolean>(false);
   const [response, setResponse] = useState<string>();
   const [openFileSelector, { plainFiles, errors }] = useFilePicker({
      accept: [".csv"],
   });

   // Effect that uploads the backup file and loads it into the database when the files are selected
   useEffect(() => {
      (async () => {
         setLoading(true);

         if (plainFiles == null || plainFiles.length === 0) {
            setLoading(false);
            return;
         }

         if (
            plainFiles.find(file => file.name.toLowerCase().includes("edges")) == null ||
            plainFiles.find(file => file.name.toLowerCase().includes("nodes")) == null ||
            plainFiles.length !== 2
         ) {
            setResponse(
               "Error: You should upload 2 CSV files one containing the word 'nodes' in the name and one containing the word 'edges' in the name",
            );
            setLoading(false);
            return;
         }

         try {
            const filesUploadResponse = await uploadAdminFiles({ files: plainFiles });
            const nodesFileName = filesUploadResponse.fileNames.find(name =>
               name.toLowerCase().includes("nodes"),
            );
            const edgesFileName = filesUploadResponse.fileNames.find(name =>
               name.toLowerCase().includes("edges"),
            );
            let response = "";
            response += JSON.stringify(await importDbRequest({ fileName: nodesFileName }), null, 2);
            response += JSON.stringify(await importDbRequest({ fileName: edgesFileName }), null, 2);
            setResponse(response);
         } catch (error) {
            setResponse(tryToGetErrorMessage(error));
         }

         setLoading(false);
      })();
   }, [plainFiles]);

   useEffect(() => {
      if (errors != null && errors.length > 0) {
         setResponse(JSON.stringify(errors, null, 2));
      }
   }, [errors]);

   const handleImportClick = async () => {
      openFileSelector();
   };

   const handleExportClick = async () => {
      setLoading(true);
      const response = await exportDbRequest();
      setResponse(JSON.stringify(response, null, 2));
      window.location.href = `${window.location.origin}/${response.folder}`;
      setLoading(false);
   };

   return (
      <CardColumn>
         <ResponseText responseText={response} />
         <LoadingButton loading={loading} variant="outlined" onClick={handleImportClick}>
            Import database content
         </LoadingButton>
         <LoadingButton loading={loading} variant="outlined" onClick={handleExportClick}>
            Export database content
         </LoadingButton>
      </CardColumn>
   );
};

export default ButtonImportDatabaseContent;
