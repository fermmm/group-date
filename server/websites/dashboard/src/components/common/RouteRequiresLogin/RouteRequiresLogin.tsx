import React, { FC } from "react";
import { Route } from "react-router-dom";
import { useLoginStatus } from "../../../common-tools/authentication/useLoginStatus";
import { Login } from "../../pages/Login/Login";

const RouteRequiresLogin: FC<React.ComponentProps<typeof Route>> = props => {
   const userIsLogged = useLoginStatus();

   return <Route {...props}>{userIsLogged ? props.children : <Login />}</Route>;
};

export default RouteRequiresLogin;
