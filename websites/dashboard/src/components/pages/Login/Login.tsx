import React, { FC, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { TextField } from "@mui/material";
import { ErrorText, LoginContainer, LoginFormContainer, Logo } from "./styles.Login";
import logo from "../../../assets/logo.png";
import { saveCredentialsInStorage } from "../../../common-tools/authentication/authentication";
import { validateCredentialsGet } from "../../../api/server/login";

export const Login: FC = () => {
   const [user, setUser] = useState<string>();
   const [password, setPassword] = useState<string>();
   const [error, setError] = useState<string>();
   const [loading, setLoading] = useState(false);

   const handleLoginSend = async () => {
      setLoading(true);
      const validationResult = await validateCredentialsGet({ user, password });
      setLoading(false);

      if (validationResult.isValid) {
         saveCredentialsInStorage({ user, password });
      } else {
         setError(validationResult.error);
      }
   };

   return (
      <LoginContainer>
         <Logo src={logo} alt={"logo"} />
         <LoginFormContainer>
            <TextField
               id="outlined-basic"
               label="USER"
               variant="outlined"
               value={user}
               onChange={e => setUser(e.target.value)}
            />
            <TextField
               id="outlined-basic"
               label="PASSWORD"
               variant="outlined"
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
            />
            <LoadingButton loading={loading} variant="outlined" onClick={handleLoginSend}>
               Login
            </LoadingButton>
            {error && <ErrorText>{error}</ErrorText>}
         </LoginFormContainer>
      </LoginContainer>
   );
};
