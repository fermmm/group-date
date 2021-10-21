import React, { FC, useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFilePicker } from "use-file-picker";
import { loadCSVRequest, uploadAdminFiles } from "../../../../api/server/techOps";
import { tryToGetErrorMessage } from "../../../../api/tools/tryToGetErrorMessage";

interface PropsButtonLoadDatabaseBackup {
   onResponse: (response: string) => void;
}

const ButtonLoadDatabaseBackup: FC<PropsButtonLoadDatabaseBackup> = props => {
   const { onResponse } = props;
   const [loading, setLoading] = useState<boolean>(false);
   const [openFileSelector, { plainFiles, errors }] = useFilePicker({
      accept: [".csv"]
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
            onResponse(
               "Error: You should upload 2 CSV files one containing the word 'nodes' in the name and one containing the word 'edges' in the name"
            );
            setLoading(false);
            return;
         }

         try {
            const filesUploadResponse = await uploadAdminFiles({ files: plainFiles });
            const nodesFileName = filesUploadResponse.fileNames.find(name =>
               name.toLowerCase().includes("nodes")
            );
            const edgesFileName = filesUploadResponse.fileNames.find(name =>
               name.toLowerCase().includes("edges")
            );
            let response = "";
            response += JSON.stringify(await loadCSVRequest({ fileName: nodesFileName }), null, 2);
            response += JSON.stringify(await loadCSVRequest({ fileName: edgesFileName }), null, 2);
            onResponse(response);
         } catch (error) {
            onResponse(tryToGetErrorMessage(error));
         }

         setLoading(false);
      })();
   }, [plainFiles]);

   useEffect(() => {
      if (errors != null && errors.length > 0) {
         onResponse(JSON.stringify(errors, null, 2));
      }
   }, [errors]);

   const handleButtonClick = async () => {
      openFileSelector();
   };

   return (
      <LoadingButton loading={loading} variant="outlined" onClick={handleButtonClick}>
         Load database backup
      </LoadingButton>
   );
};

export default ButtonLoadDatabaseBackup;
