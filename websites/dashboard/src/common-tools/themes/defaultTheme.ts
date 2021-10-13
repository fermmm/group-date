import { Theme } from "./typings/Theme";
import { createTheme } from "@mui/material/styles";

export const defaultTheme: Theme = {
   colors: {
      background1: "linear-gradient(#151515 50%,#242a43)",
      background2: "#2C2C2C",
      text1: "#A8A8A8",
      scrollbar: "#00000000",
      scrollbarThumb: "#868686"
   },
   shadows: {
      elevation1: "1px 10px 0px 0px #00000024;"
   },
   fonts: {
      font1: '"Montserrat", sans-serif',
      size1: "20px",
      weight1: "600",
      letterSpacing1: "-0.26px",
      lineHeight1: "21px"
   },
   borders: {
      borderRadius1: "20px"
   }
};

/** Theme for material UI */
export const muiTheme = createTheme({
   palette: {
      mode: "dark"
   },
   typography: {
      fontFamily: [
         "-apple-system",
         "BlinkMacSystemFont",
         '"Segoe UI"',
         "Montserrat",
         '"Helvetica Neue"',
         "Arial",
         "sans-serif",
         '"Apple Color Emoji"',
         '"Segoe UI Emoji"',
         '"Segoe UI Symbol"'
      ].join(",")
   }
});
