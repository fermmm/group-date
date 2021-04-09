import React, { FC, ReactElement, useState } from "react";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

export interface SimpleDialogProps {
  buttonToOpen: (
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  ) => ReactElement;
  buttons: Array<{ label: string; value: string; icon?: () => ReactElement }>;
  onClose: (value: string | null) => void;
}

const ContextMenu: FC<SimpleDialogProps> = (props) => {
  const { onClose, buttons, buttonToOpen } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose(null);
  };

  const handleListItemClick = (value: string) => {
    setOpen(false);
    onClose(value);
  };

  const handleOpenerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  return (
    <>
      {buttonToOpen(handleOpenerClick)}
      <Menu
        onClose={handleClose}
        open={open}
        anchorEl={anchorEl ?? undefined}
        keepMounted
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {buttons.map((button) => (
          <MenuItem
            onClick={() => handleListItemClick(button.value)}
            key={button.value}
          >
            {button.icon && button.icon()}
            {button.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ContextMenu;
