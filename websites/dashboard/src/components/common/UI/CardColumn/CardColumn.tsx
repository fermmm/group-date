import { Card } from "@mui/material";
import React, { FC } from "react";
import { CardContentStyled } from "./CardColumn.styles";

const CardColumn: FC = ({ children }) => {
   return (
      <Card sx={{ minWidth: 275 }}>
         <CardContentStyled>{children}</CardContentStyled>
      </Card>
   );
};

export default CardColumn;
