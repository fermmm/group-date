import React, { FC, useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFilePicker } from "use-file-picker";
import { exportDbRequest, importDbRequest, uploadAdminFiles } from "../../../../api/server/techOps";
import { tryToGetErrorMessage } from "../../../../api/tools/tryToGetErrorMessage";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import { RequestStatus } from "../../../common/UI/RequestStatus/RequestStatus";
import { Row, RowCentered } from "../../../common/UI/Row/Row";
import { DatabaseContentFileFormat } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import { ButtonComment } from "./styles.ImportExportForm";

const ImportExportForm: FC = props => {
   const [loading, setLoading] = useState<boolean>(false);
   const [response, setResponse] = useState<string | object>();
   const [openFileSelector, { plainFiles, errors }] = useFilePicker({
      accept: [".csv", ".gremlin", ".xml"],
      multiple: true,
   });

   // Effect that uploads the backup file and loads it into the database when the files are selected
   useEffect(() => {
      (async () => {
         setLoading(true);

         if (plainFiles == null || plainFiles.length === 0) {
            setLoading(false);
            return;
         }

         const errors = getFileErrors(plainFiles);

         if (errors.length > 0) {
            setResponse(
               "Errors found in files selected:\n" + errors.map((error, i) => `${i + 1}. ${error}`).join("\n"),
            );
            setLoading(false);
            return;
         }

         try {
            const format = getFormatFromExtension(plainFiles[0].name.split(".").pop());
            const filesUploadResponse = await uploadAdminFiles({ files: plainFiles });
            const importResponse = await importDbRequest({ fileNames: filesUploadResponse.fileNames, format });
            setResponse(importResponse);
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
      setResponse(null);
   };

   const handleExportClick = async () => {
      setLoading(true);
      const exportResponse = await exportDbRequest();
      setResponse(JSON.stringify(exportResponse, null, 2));
      window.location.href = `${window.location.origin}/${exportResponse.folder}`;
      setLoading(false);
   };

   const getFileErrors = (files: File[]) => {
      const errors: string[] = [];
      const firstFileExtension = files[0].name.split(".").pop();

      files.forEach(file => {
         const fileExtension = file.name.split(".").pop();
         if (fileExtension !== firstFileExtension) {
            errors.push("All files should have the same extension");
         }
      });

      return errors;
   };

   const getFormatFromExtension = (extension: string) => {
      extension = extension.toLocaleLowerCase();

      if (extension === "csv") {
         return DatabaseContentFileFormat.NeptuneCsv;
      } else if (extension === "gremlin") {
         return DatabaseContentFileFormat.GremlinQuery;
      } else if (extension === "xml") {
         return DatabaseContentFileFormat.GraphMl;
      }
   };

   return (
      <>
         <CardColumn>
            <RequestStatus loading={loading}>
               <ResponseDisplay response={response} />
               <RowCentered>
                  <LoadingButton loading={loading} variant="outlined" onClick={handleImportClick}>
                     Import database content
                  </LoadingButton>
                  <ButtonComment>
                     If you import a format that uses multiple files{" "}
                     <b>remember to import the node files first.</b> Multiple file selection is supported.
                  </ButtonComment>
               </RowCentered>
               <LoadingButton loading={loading} variant="outlined" onClick={handleExportClick}>
                  Export database content
               </LoadingButton>
            </RequestStatus>
         </CardColumn>
      </>
   );
};

export default ImportExportForm;
