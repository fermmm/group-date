import React, { FC } from "react";
import FacebookLogin, { ReactFacebookLoginInfo } from "react-facebook-login";
import { LoginContainer, Logo } from "./styles.Login";
import logo from "../../../assets/logo.png";
import { saveToken } from "../../../api/tools/tokenStorage";

interface PropsLogin {
   onLoginSuccess: () => void;
}

export const Login: FC<PropsLogin> = ({ onLoginSuccess }) => {
   const handleFacebookResponse = (userInfo: ReactFacebookLoginInfo) => {
      if (userInfo?.accessToken != null) {
         saveToken(userInfo.accessToken);
         onLoginSuccess();
      }
   };

   return (
      <LoginContainer>
         <Logo src={logo} alt={"logo"} />
         <FacebookLogin
            appId={process.env.REACT_APP_FACEBOOK_APP_ID as string}
            fields="name,email,picture"
            callback={handleFacebookResponse}
         />
      </LoginContainer>
   );
};
