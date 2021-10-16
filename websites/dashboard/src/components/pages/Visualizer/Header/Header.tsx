import React, { FC, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { FormContainer, HeaderContainer, NodeLimitTextField } from "./styles.Header";
import { OnSearchFunc } from "../Visualizer";
import { getStartingPreset, PresetQueryItem } from "./QueryInput/tools/presets";
import QueryInput from "./QueryInput/QueryInput";

interface PropsHeader {
   loading: boolean;
   onSearch: OnSearchFunc;
}

const Header: FC<PropsHeader> = props => {
   const { loading, onSearch } = props;
   const [nodeLimit, setNodeLimit] = useState<number>(150);
   const [query, setQuery] = useState<PresetQueryItem>(getStartingPreset());

   const handleSearch = () => {
      onSearch({ query: query.query, nodeLimit });
   };

   return (
      <HeaderContainer>
         <FormContainer>
            <QueryInput value={query} onChange={setQuery} onEnterPress={handleSearch} />
            <LoadingButton
               loading={loading}
               variant="contained"
               color="secondary"
               onClick={handleSearch}
            >
               Send
            </LoadingButton>
            <NodeLimitTextField
               label="LIMIT"
               variant="outlined"
               size="small"
               color="secondary"
               type="number"
               value={nodeLimit}
               onChange={e => setNodeLimit(Number(e.target.value))}
            />
         </FormContainer>
      </HeaderContainer>
   );
};

export default Header;
