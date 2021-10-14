import React, { FC } from "react";
import { Switch, Route, useHistory } from "react-router-dom";
import {
   VscListSelection,
   VscClose,
   VscTypeHierarchySuper,
   VscSymbolProperty
} from "react-icons/vsc";
import Drawer from "../../common/UI/Drawer/Drawer";
import Logs from "../Logs/Logs";
import RouteRequiresLogin from "../../common/RouteRequiresLogin/RouteRequiresLogin";
import { logout } from "../../../common-tools/authentication/authentication";
import { useLoginStatus } from "../../../common-tools/authentication/useLoginStatus";
import { Login } from "../Login/Login";
import Visualizer from "../Visualizer/Visualizer";
import TechOps from "../TechOps/TechOps";

const Main: FC = () => {
   const history = useHistory();
   const isLogged = useLoginStatus();

   if (!isLogged) {
      return <Login />;
   }

   return (
      <Drawer
         buttons={[
            {
               label: "Visualizer",
               icon: () => <VscTypeHierarchySuper />,
               onClick: () => history.push("/visualizer")
            },
            {
               label: "Logs",
               icon: () => <VscListSelection />,
               onClick: () => history.push("/logs"),
               marginBottom: 40
            },
            {
               label: "Tech Operations",
               icon: () => <VscSymbolProperty />,
               onClick: () => history.push("/tech-ops")
            },
            {
               label: "Logout",
               icon: () => <VscClose />,
               onClick: () => logout()
            }
         ]}
      >
         <Switch>
            <RouteRequiresLogin exact path="/">
               <Logs />
            </RouteRequiresLogin>
            <RouteRequiresLogin path="/logs">
               <Logs />
            </RouteRequiresLogin>
            <RouteRequiresLogin path="/visualizer">
               <Visualizer />
            </RouteRequiresLogin>
            <RouteRequiresLogin path="/tech-ops">
               <TechOps />
            </RouteRequiresLogin>
         </Switch>
      </Drawer>
   );
};

export default Main;
