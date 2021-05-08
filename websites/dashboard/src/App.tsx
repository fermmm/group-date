import React, { FC } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { QueryClientProvider } from "react-query";
import { defaultTheme, muiTheme } from "./common-tools/themes/defaultTheme";
import { GlobalStyles } from "./common-tools/themes/globalStyles/GlobalStyles";
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import Main from "./components/pages/Main/Main";
import { queryClient } from "./api/tools/cacheConfig";

const App: FC = () => {
   return (
      <QueryClientProvider client={queryClient}>
         <ThemeProvider theme={defaultTheme}>
            <MuiThemeProvider theme={muiTheme}>
               <GlobalStyles />
               <Router>
                  <Main />
               </Router>
            </MuiThemeProvider>
         </ThemeProvider>
      </QueryClientProvider>
   );
};

export default App;
