import { FC, ReactElement } from "react";
import React from "react";
import clsx from "clsx";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import logo from "../../../../assets/logo.png";
import { DrawerMui, useDrawerMuiStyles } from "./styles.Drawer";

interface PropsDrawer {
  buttons: Array<{
    icon: () => ReactElement;
    label: string;
    onClick: () => void;
  }>;
}

const Drawer: FC<PropsDrawer> = ({ buttons, children }) => {
  const classes = useDrawerMuiStyles();
  const [expanded, setExpanded] = React.useState(false);

  const handleDrawerExpand = () => {
    setExpanded(true);
  };

  const handleDrawerContract = () => {
    setExpanded(false);
  };

  return (
    <div className={classes.root}>
      <DrawerMui
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: expanded,
          [classes.drawerClose]: !expanded,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: expanded,
            [classes.drawerClose]: !expanded,
          }),
        }}
        onMouseEnter={handleDrawerExpand}
        onMouseLeave={handleDrawerContract}
      >
        <div className={classes.toolbar}>
          <img src={logo} style={{ height: 40 }} alt={"logo"} />
        </div>
        <List>
          {buttons.map((button) => (
            <ListItem button key={button.label} onClick={button.onClick}>
              <ListItemIcon>{button.icon()}</ListItemIcon>
              <ListItemText primary={button.label} />
            </ListItem>
          ))}
        </List>
      </DrawerMui>
      <main className={classes.content}>{children}</main>
    </div>
  );
};

export default Drawer;
