import styled from "styled-components";

export const ColumnCentered = styled("div")`
   display: flex;
   flex-direction: column;
   justify-content: center;
   width: 100%;
`;

export const ColumnCenteredBothAxis = styled(ColumnCentered)`
   align-items: center;
`;
