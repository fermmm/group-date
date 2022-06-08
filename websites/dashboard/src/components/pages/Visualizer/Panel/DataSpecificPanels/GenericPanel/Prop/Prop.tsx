import { Checkbox, FormControlLabel, IconButton, TextField } from "@mui/material";
import React, { ChangeEvent, FC, useState } from "react";
import { VscChromeClose, VscEdit, VscSave } from "react-icons/vsc";
import { decodeString } from "../../../../../../../api/tools/shared-tools/utility-functions/decodeString";
import { encodeString } from "../../../../../../../api/tools/shared-tools/utility-functions/encodeString";
import { getGlobalSettingValue } from "../../../../../../../common-tools/settings/global-settings";
import { humanizeUnixTimeStamp } from "../../../../../../../common-tools/strings/humanizeUnixTime";
import { isProbablyEncodedProp } from "../../../../../../../common-tools/strings/isProbablyEncodedProp";
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
   const showDecoded = getGlobalSettingValue("showDecoded");
   const [editMode, setEditMode] = useState(false);
   const [newPropValue, setNewPropValue] = useState<string | number | boolean>(
      showDecoded && typeof propValue === "string" ? decodeString(propValue) : propValue,
   );
   const [sendEncoded, setSendEncoded] = useState<boolean>(
      showDecoded && typeof propValue === "string" ? isProbablyEncodedProp(propName) : false,
   );

   const setupValueToDisplay = (key: string, value: string | number | boolean) => {
      if (showDecoded && typeof value === "string") {
         value = decodeString(value);
      }

      if (unixTimeProps.includes(key)) {
         return humanizeUnixTimeStamp(Number(value));
      }

      return String(value);
   };

   const setupNewValueToSend = (value: string) => {
      if (typeof propValue === "number") {
         value = value.replace(/\D/g, "");
      }

      return value;
   };

   const switchEditMode = (props: { cancelled: boolean }) => {
      const { cancelled } = props;
      setEditMode(!editMode);
      if (cancelled) {
         // If the user cancelled the edit we restore the value to the one on the server
         setNewPropValue(showDecoded && typeof propValue === "string" ? decodeString(propValue) : propValue);
      }
   };

   const handleSave = () => {
      let valueToSend: string | number | boolean = newPropValue;

      if (typeof propValue === "number") {
         valueToSend = Number(valueToSend);
      }

      if (typeof propValue === "string" && sendEncoded) {
         valueToSend = encodeString(valueToSend as string);
      }

      onEdit(propName, valueToSend, isVertex);
      switchEditMode({ cancelled: false });
   };

   return (
      <MainContainer>
         {editMode ? (
            <>
               {typeof propValue === "string" || typeof propValue === "number" ? (
                  <>
                     <TextField
                        label={propName}
                        variant="standard"
                        type={"text"}
                        multiline
                        fullWidth
                        value={newPropValue}
                        onChange={e => setNewPropValue(setupNewValueToSend(e.target.value))}
                     />
                  </>
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
               {propValue != null && <ValueLabel>{setupValueToDisplay(propName, propValue)}</ValueLabel>}
            </NonEditModeContainer>
         )}
         <Row>
            {editMode && typeof propValue === "string" && (
               <FormControlLabel
                  label={"Send encoded"}
                  control={
                     <Checkbox
                        checked={sendEncoded}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSendEncoded(e.target.checked)}
                        inputProps={{ "aria-label": "controlled" }}
                     />
                  }
               />
            )}
            {editMode && (
               <IconButton onClick={handleSave}>
                  <VscSave />
               </IconButton>
            )}
            {onEdit != null && (
               <IconButton onClick={() => switchEditMode({ cancelled: editMode })}>
                  {editMode ? <VscChromeClose /> : <VscEdit />}
               </IconButton>
            )}
         </Row>
      </MainContainer>
   );
};

export default Prop;
