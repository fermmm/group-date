import React, { FC, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import {
   FormContainer,
   HeaderContainer,
   NodeLimitTextField,
   QueryTextField
} from "./styles.Header";

interface PropsHeader {
   loading: boolean;
   onSearch: (query: string, nodeLimit?: number, reset?: boolean) => void;
}

const Header: FC<PropsHeader> = props => {
   const { loading, onSearch } = props;
   const [query, setQuery] = useState<string>('g.V().has("name", "")');
   const [nodeLimit, setNodeLimit] = useState<number>(150);

   return (
      <HeaderContainer>
         <FormContainer>
            <QueryTextField
               variant="outlined"
               size="small"
               color="secondary"
               fullWidth
               value={query}
               onChange={e => setQuery(e.target.value)}
            />
            <LoadingButton
               loading={loading}
               variant="contained"
               color="secondary"
               onClick={() => onSearch(query, nodeLimit)}
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
