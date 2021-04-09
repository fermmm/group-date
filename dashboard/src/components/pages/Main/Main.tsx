import React, { FC } from "react";
import { Switch, Route, useHistory } from "react-router-dom";
import { VscListSelection } from "react-icons/vsc";
import Drawer from "../../common/UI/Drawer/Drawer";
import Logs from "../Logs/Logs";

const Main: FC = () => {
  const history = useHistory();

  return (
    <Drawer
      buttons={[
        {
          label: "Logs",
          icon: () => <VscListSelection />,
          onClick: () => history.push("/logs"),
        },
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
