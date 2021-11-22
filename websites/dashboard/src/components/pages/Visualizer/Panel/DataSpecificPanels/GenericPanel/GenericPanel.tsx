import Button from "@mui/material/Button";
import React, { FC, useState } from "react";
import { humanizeUnixTimeStamp } from "../../../../../../common-tools/strings/humanizeUnixTime";
import ConfirmationDialog from "../../../../../common/UI/ConfirmationDialog/ConfirmationDialog";
import { OnSearchFunc } from "../../../Visualizer";
import { KeyLabel, PropertiesContainer, ValueLabel } from "./styles.GenericPanel";

export interface PropsGenericPropertiesTable {
   id: string | number;
   label: string;
   properties: Record<string, string | number | boolean>;
   isVertex: boolean | undefined;
   hideProps?: string[];
   onSearch: OnSearchFunc;
   onRefresh: () => void;
}

export interface QueryButtonProps {
   name: string;
   query: string;
   visualize?: boolean;
}

const GenericPanel: FC<PropsGenericPropertiesTable> = props => {
   const { properties, hideProps, id, isVertex } = props;
   const [confirmationDialogProps, setConfirmationDialogProps] =
      useState<{ message: string; onConfirm: () => void }>(null);

   const keys = Object.keys(properties ?? {}).sort();

   const unixTimeProps = [
      "lastGroupJoinedDate",
      "birthDate",
      "lastLoginDate",
      "creationDate",
      "mostVotedDate",
      "lastInteractionDate",
      "timestamp",
   ];

   const setupValueText = (key: string, value: string | number | boolean) => {
      if (unixTimeProps.includes(key)) {
         return humanizeUnixTimeStamp(Number(value));
      }

      return String(value);
   };

   const elementSelectionQuery = isVertex
      ? `g.V(${typeof id === "string" ? `"${id}"` : id})`
      : `g.E(${typeof id === "string" ? `"${id}"` : id})`;

   const dangerousQueryButtons: QueryButtonProps[] = [
      {
         name: "Delete",
         query: `${elementSelectionQuery}.drop()`,
         visualize: false,
      },
   ];

   return (
      <>
         {keys.map(
            key =>
               (!hideProps || !hideProps.includes(key)) && (
                  <div key={key}>
                     <KeyLabel>{key}</KeyLabel>
                     <ValueLabel>{setupValueText(key, properties[key])}</ValueLabel>
                  </div>
               ),
         )}
         {dangerousQueryButtons.map((buttonData, i) => (
            <Button
               variant="outlined"
               color="error"
               onClick={() => {
                  setConfirmationDialogProps({
                     message: "Delete element?",
                     onConfirm: () =>
                        props.onSearch({ query: buttonData.query, visualize: buttonData.visualize }),
                  });
               }}
               key={i}
            >
               {buttonData.name}
            </Button>
         ))}
         <ConfirmationDialog
            open={confirmationDialogProps != null}
            text={confirmationDialogProps?.message}
            onContinueClick={confirmationDialogProps?.onConfirm}
            onClose={() => setConfirmationDialogProps(null)}
            continueButtonText={"Confirm"}
            cancelButtonText={"Cancel"}
         />
      </>
   );
};

export default GenericPanel;
