import React, { FC } from "react";
import { styled as styledMui } from "@mui/material/styles";
import TooltipMui, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import Zoom from "@mui/material/Zoom";

export interface PropsTooltip {
   text: string;
   placement?:
      | "bottom-end"
      | "bottom-start"
      | "bottom"
      | "left-end"
      | "left-start"
      | "left"
      | "right-end"
      | "right-start"
      | "right"
      | "top-end"
      | "top-start"
      | "top";
   children: React.ReactElement<any, any>;
}

export const Tooltip: FC<PropsTooltip> = props => {
   const { children, text, placement = "right" } = props;

   return (
      <TooltipStyled title={text} arrow placement={placement} TransitionComponent={Zoom}>
         {children}
      </TooltipStyled>
   );
};

const TooltipStyled = styledMui(({ className, ...props }: TooltipProps) => (
   <TooltipMui {...props} classes={{ popper: className }} />
))(({ theme }) => ({
   [`& .${tooltipClasses.tooltip}`]: {
      fontSize: 14,
   },
}));
