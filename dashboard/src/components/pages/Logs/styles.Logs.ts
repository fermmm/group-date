import styled from "styled-components";
import Button from "@material-ui/core/Button";

export const LogsContainer = styled("div")`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

export const ChangeLogFab = styled(Button)`
  position: absolute;
  top: 0px;
  padding: 5px 88px;
`;
