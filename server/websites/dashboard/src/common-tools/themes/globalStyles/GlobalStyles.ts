import { createGlobalStyle, DefaultTheme, GlobalStyleComponent } from "styled-components";
// @ts-ignore
import "./fonts-loading.scss";

export const GlobalStyles: GlobalStyleComponent<{}, DefaultTheme> = createGlobalStyle`
   html, body {
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      background: ${props => props.theme.colors.background1};
      font-family: ${props => props.theme.fonts.font1};
      color: white;
   }
   
   a:hover, a:visited, a:link, a:active {
      text-decoration: none;   /* Removes underline in link texts */ 
      border:          none;   /* Removes border in linked items */
      outline:         none;   /* Removes points border in images */
   }
   
   *:focus {
      outline: none;           /* Removes the selection outline from inputs and buttons */
   }
   
   *, :after, :before {
      box-sizing: border-box;  /* Do not include border and margin in the sizes numbers */
   }

   input[type=number]::-webkit-inner-spin-button, 
   input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
   }

   ::-webkit-scrollbar {
      width: 18px;
      height: 7px;
      margin: 0px;
   }

   ::-webkit-scrollbar-track {
      background-color: transparent;
      border-radius: 20px;
   }

   ::-webkit-scrollbar-thumb {
      border: 5px solid transparent;
      background-clip: content-box;
      border-radius: 20px;
      background-color: #565656;
   }

   ::-webkit-scrollbar-thumb:hover {
      border: 5px solid transparent;
      background-clip: content-box;
      background-color: #565656;
   }

   ::-webkit-scrollbar-corner {
      background-color: transparent;
      border-radius: 20px;
   }
`;
