import React, { FC, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Login } from "./components/pages/Login/Login";
import { defaultTheme, muiTheme } from "./common-tools/themes/defaultTheme";
import { GlobalStyles } from "./common-tools/themes/globalStyles/GlobalStyles";
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import Main from "./components/pages/Main/Main";
import { getToken } from "./common-tools/storage/tokenStorage";

const App: FC = () => {
  const [logged, setLogged] = useState(getToken() != null);

  const handleLoginSuccess = () => {
    setLogged(true);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <MuiThemeProvider theme={muiTheme}>
        <GlobalStyles />
        <Router>
          {logged ? <Main /> : <Login onLoginSuccess={handleLoginSuccess} />}
        </Router>
      </MuiThemeProvider>
    </ThemeProvider>
  );
};

export default App;
