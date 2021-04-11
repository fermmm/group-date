import React, { FC, useState } from "react";
import { Switch, Route, useHistory } from "react-router-dom";
import { VscListSelection } from "react-icons/vsc";
import Drawer from "../../common/UI/Drawer/Drawer";
import Logs from "../Logs/Logs";
import { getToken } from "../../../api/tools/tokenStorage";
import { useProfileStatus } from "../../../api/server/user";
import { Login } from "../Login/Login";
import { RequestsStatus } from "../../common/UI/RequestStatus/RequestStatus";

const Main: FC = () => {
   const history = useHistory();
   const [token, setToken] = useState(getToken());
   const { isLoading, error } = useProfileStatus({
      params: { token: token },
      options: { enabled: token != null }
   });

   const handleLoginSuccess = () => {
      setToken(getToken());
   };

   if (isLoading) {
      return <RequestsStatus loading={isLoading} />;
   }

   if (!token || error) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
   }

   return (
      <Drawer
         buttons={[
            {
               label: "Logs",
               icon: () => <VscListSelection />,
               onClick: () => history.push("/logs")
            }
         ]}
      >
         <Switch>
            <Route exact path="/">
               <Logs />
            </Route>
            <Route path="/logs">
               <Logs />
            </Route>
         </Switch>
      </Drawer>
   );
};

export default Main;
