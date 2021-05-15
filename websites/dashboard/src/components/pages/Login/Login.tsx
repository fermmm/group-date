import React, { FC } from "react";
import FacebookLogin, { ReactFacebookLoginInfo } from "react-facebook-login";
import { LoginContainer, Logo } from "./styles.Login";
import logo from "../../../assets/logo.png";
import { saveToken } from "../../../api/tools/tokenStorage";
import { getFacebookAppId } from "./tools/getFacebookAppId";
import { createExtendedInfoToken } from "../../../api/tools/shared-tools/authentication/tokenStringTools";
import { AuthenticationProvider } from "../../../api/tools/shared-tools/authentication/AuthenticationProvider";

interface PropsLogin {
   onLoginSuccess: () => void;
}

export const Login: FC<PropsLogin> = ({ onLoginSuccess }) => {
   const handleFacebookResponse = (userInfo: ReactFacebookLoginInfo) => {
      if (userInfo?.accessToken != null) {
         saveToken(
            createExtendedInfoToken({
               originalToken: userInfo.accessToken,
               provider: AuthenticationProvider.Facebook
            })
         );
         onLoginSuccess();
      }
   };

   return (
      <LoginContainer>
         <Logo src={logo} alt={"logo"} />
         <FacebookLogin
            appId={getFacebookAppId()}
            fields="name,email,picture"
            callback={handleFacebookResponse}
         />
      </LoginContainer>
   );
};
