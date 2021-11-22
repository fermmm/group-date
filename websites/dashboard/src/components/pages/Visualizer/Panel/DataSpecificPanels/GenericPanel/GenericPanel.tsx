import React, { FC, useState } from "react";
import Button from "@mui/material/Button";
import ConfirmationDialog from "../../../../../common/UI/ConfirmationDialog/ConfirmationDialog";
import { OnSearchFunc } from "../../../Visualizer";
import Prop from "./Prop/Prop";

export interface PropsGenericPropertiesTable {
   id: string | number;
   label: string;
   properties: Record<string, string | number | boolean>;
   isVertex: boolean | undefined;
   hideProps?: string[];
   onSearch: OnSearchFunc;
   onRefresh: () => void;
   onPropEdit: (propName: string, propValue: string | number | boolean) => void;
}

export interface QueryButtonProps {
   name: string;
   query: string;
   visualize?: boolean;
}

const GenericPanel: FC<PropsGenericPropertiesTable> = props => {
   const { properties, hideProps, id, isVertex, onPropEdit } = props;
   const [confirmationDialogProps, setConfirmationDialogProps] =
      useState<{ message: string; onConfirm: () => void }>(null);

   const keys = Object.keys(properties ?? {}).sort();

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
                  <Prop propName={key} propValue={properties[key]} onEdit={onPropEdit} key={key} />
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
