import React, { FC } from "react";
import FacebookLogin, { ReactFacebookLoginInfo } from "react-facebook-login";
import { LoginContainer, Logo } from "./styles.Login";
import logo from "../../../assets/logo.png";
import { useState } from "react";
import { saveToken } from "../../../common-tools/storage/tokenStorage";

interface PropsLogin {
  onLoginSuccess: () => void;
}

export const Login: FC<PropsLogin> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFacebookResponse = (userInfo: ReactFacebookLoginInfo) => {
    if (userInfo?.accessToken != null) {
      saveToken(userInfo.accessToken);
      onLoginSuccess();
    } else {
      setError(JSON.stringify(userInfo));
    }
  };

  return (
    <LoginContainer>
      {error != null ? (
        error
      ) : (
        <>
          <Logo src={logo} alt={"logo"} />
          <FacebookLogin
            appId={process.env.REACT_APP_FACEBOOK_APP_ID as string}
            autoLoad={true}
            fields="name,email,picture"
            callback={handleFacebookResponse}
          />
        </>
      )}
    </LoginContainer>
  );
};
