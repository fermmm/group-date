import { TextField } from "@mui/material";
import React, { FC, useRef } from "react";
import { AutocompleteTextField } from "./styles.QueryInput";
import { getCarrotPos, PresetQueryItem, queryPresets } from "./tools/presets";

interface PropsQueryInput {
   value: PresetQueryItem;
   onChange: (newValue: PresetQueryItem) => void;
   onEnterPress: () => void;
}

const QueryInput: FC<PropsQueryInput> = props => {
   const { value, onChange, onEnterPress } = props;
   const inputRef = useRef<HTMLInputElement>();
   const initialized = useRef<boolean>(false);

   const setCarrotPos = (query: string) => {
      if (inputRef?.current) {
         setTimeout(() => {
            const carrotPos = getCarrotPos(query);
            inputRef.current.focus();
            inputRef.current.selectionStart = carrotPos.start;
            inputRef.current.selectionEnd = carrotPos.end;
         }, 16);
      }
   };

   return (
      <AutocompleteTextField
         fullWidth
         freeSolo
         options={queryPresets}
         groupBy={(option: any) => option.category}
         getOptionLabel={(option: any) => option.query}
         renderOption={(props, option: any) => <li {...props}>{option.name}</li>}
         clearOnBlur={false}
         clearOnEscape={false}
         value={value}
         onChange={(e, newValue: any) => {
            setCarrotPos(newValue?.query);
            onChange(newValue);
         }}
         onInputChange={(e, newValue: string) => {
            if (initialized.current === false) {
               setCarrotPos(newValue);
               initialized.current = true;
            }
            onChange({ query: newValue });
         }}
         renderInput={params => {
            return (
               <TextField
                  {...params}
                  autoFocus
                  variant="outlined"
                  size="small"
                  color="secondary"
                  fullWidth
                  onFocus={e => {
                     inputRef.current = e.target as HTMLInputElement;
                  }}
                  onKeyDown={event => {
                     if (event.key === "Enter") {
                        onEnterPress();
                     }
                  }}
               />
            );
         }}
      />
   );
};

export default QueryInput;
