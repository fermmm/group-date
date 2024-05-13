import styled from "styled-components";

export const LoginContainer = styled("div")`
   display: flex;
   flex-direction: column;
   align-items: center;
   margin-top: 20vh;
   width: 100vw;
   height: 80vh;
`;

export const Logo = styled("img")`
   height: 100px;
   margin-bottom: 50px;
   transform: translateX(15px);
`;

export const LoginFormContainer = styled("div")`
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: flex-start;
   row-gap: 15px;
`;

export const ErrorText = styled("div")`
   bottom: -35px;
   text-align: center;
`;
