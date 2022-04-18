import { Checkbox, FormControlLabel, IconButton, TextField } from "@mui/material";
import React, { ChangeEvent, FC, useState } from "react";
import { VscChromeClose, VscEdit, VscSave } from "react-icons/vsc";
import { humanizeUnixTimeStamp } from "../../../../../../../common-tools/strings/humanizeUnixTime";
import { Row } from "../../../../../../common/UI/Row/Row";
import { KeyLabel, MainContainer, NonEditModeContainer, ValueLabel } from "./styles.Prop";

export interface PropsProp {
   propName: string;
   propValue?: string | number | boolean;
   onEdit?: (key: string, value: string | number | boolean, isVertex: boolean) => void;
   showType?: boolean;
   isVertex: boolean;
}

const unixTimeProps = [
   "lastGroupJoinedDate",
   "birthDate",
   "lastLoginDate",
   "creationDate",
   "mostVotedDate",
   "lastInteractionDate",
   "timestamp",
];

const Prop: FC<PropsProp> = props => {
   const { propName, propValue, onEdit, showType, isVertex } = props;
   const [editMode, setEditMode] = useState(false);
   const [newPropValue, setNewPropValue] = useState(propValue);

   const setupValueText = (key: string, value: string | number | boolean) => {
      if (unixTimeProps.includes(key)) {
         return humanizeUnixTimeStamp(Number(value));
      }

      return String(value);
   };

   const switchEditMode = () => {
      setEditMode(!editMode);
      setNewPropValue(propValue);
   };

   const handleEdit = () => {
      let propValueTyped: string | number | boolean;

      if (typeof propValue === "number") {
         propValueTyped = Number(newPropValue);
      } else {
         propValueTyped = newPropValue;
      }

      onEdit(propName, propValueTyped, isVertex);
      switchEditMode();
   };

   return (
      <MainContainer>
         {editMode ? (
            <>
               {typeof propValue === "string" || typeof propValue === "number" ? (
                  <TextField
                     label={propName}
                     variant="standard"
                     type={"text"}
                     multiline
                     fullWidth
                     value={newPropValue}
                     onChange={e =>
                        setNewPropValue(
                           typeof propValue === "number" ? e.target.value.replace(/\D/g, "") : e.target.value,
                        )
                     }
                  />
               ) : (
                  <FormControlLabel
                     label={propName}
                     control={
                        <Checkbox
                           checked={Boolean(newPropValue)}
                           onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPropValue(e.target.checked)}
                           inputProps={{ "aria-label": "controlled" }}
                        />
                     }
                  />
               )}
            </>
         ) : (
            <NonEditModeContainer>
               <KeyLabel>
                  {propName} {showType && ` (type: ${typeof propValue})`}
               </KeyLabel>
               {propValue != null && <ValueLabel>{setupValueText(propName, propValue)}</ValueLabel>}
            </NonEditModeContainer>
         )}
         <Row>
            {editMode && (
               <IconButton onClick={handleEdit}>
                  <VscSave />
               </IconButton>
            )}
            {onEdit != null && (
               <IconButton onClick={switchEditMode}>{editMode ? <VscChromeClose /> : <VscEdit />}</IconButton>
            )}
         </Row>
      </MainContainer>
   );
};

export default Prop;
