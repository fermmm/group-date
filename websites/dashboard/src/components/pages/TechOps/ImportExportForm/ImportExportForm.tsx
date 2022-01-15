import React, { FC, useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { useFilePicker } from "use-file-picker";
import {
   deleteDatabaseRequest,
   exportDbRequest,
   importDbRequest,
   uploadAdminFiles,
} from "../../../../api/server/techOps";
import { tryToGetErrorMessage } from "../../../../api/tools/tryToGetErrorMessage";
import ResponseDisplay from "../ResponseDisplay/ResponseDisplay";
import CardColumn from "../../../common/UI/CardColumn/CardColumn";
import { RequestStatus } from "../../../common/UI/RequestStatus/RequestStatus";
import { Row, RowCentered } from "../../../common/UI/Row/Row";
import { DatabaseContentFileFormat } from "../../../../api/tools/shared-tools/endpoints-interfaces/admin";
import { ButtonComment } from "./styles.ImportExportForm";
import { Button } from "@mui/material";
import ConfirmationDialog, {
   PropsConfirmationDialog,
} from "../../../common/UI/ConfirmationDialog/ConfirmationDialog";

const ImportExportForm: FC = props => {
   const [loading, setLoading] = useState<boolean>(false);
   const [response, setResponse] = useState<string | object>();
   const [openFileSelector, { plainFiles, errors }] = useFilePicker({
      accept: [".csv", ".gremlin", ".xml"],
      multiple: true,
   });
   const [confirmationDialogProps, setConfirmationDialogProps] = useState<PropsConfirmationDialog>(null);

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
            const filesUploadResponse = await uploadAdminFiles({ files: plainFiles, folder: "db-import" });
            const importResponse = await importDbRequest({ filePaths: filesUploadResponse.filePaths, format });
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

   const handleDeleteClick = async () => {
      setConfirmationDialogProps({
         open: true,
         text: "Delete database?",
         continueButtonText: "Delete all",
         continueButtonIsRed: true,
         onContinueClick: async () => {
            setLoading(true);
            await deleteDatabaseRequest();
            setResponse("Database deleted");
            setLoading(false);
         },
         onClose: () => {
            setConfirmationDialogProps(updatedProps => ({ ...updatedProps, open: false }));
         },
      });
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
                  <Button variant="outlined" onClick={handleImportClick}>
                     Import database content
                  </Button>
                  <ButtonComment>
                     If you import a format that uses multiple files{" "}
                     <b>remember to import the node files first.</b> Multiple file selection is supported.
                  </ButtonComment>
               </RowCentered>
               <Button variant="outlined" onClick={handleExportClick}>
                  Export database content
               </Button>
               <RowCentered>
                  <Button variant="outlined" color="error" onClick={handleDeleteClick}>
                     Delete database content
                  </Button>
                  <ButtonComment>Importing database requires to delete content before you begin</ButtonComment>
               </RowCentered>
            </RequestStatus>
         </CardColumn>
         <ConfirmationDialog {...confirmationDialogProps} />
      </>
   );
};

export default ImportExportForm;
