import CircularProgress from "@mui/material/CircularProgress";
import React, { FC } from "react";
import { tryToGetErrorMessage } from "../../../../api/tools/tryToGetErrorMessage";
import { RequestStatusContainer } from "./styles.RequestStatus";

interface PropsRequestsStatus {
   loading?: boolean[] | boolean;
   error?: unknown[] | unknown;
   loadingScaleMode?: LoadingScaleMode;
}

export enum LoadingScaleMode {
   FillViewport,
   FillContainer,
}

export const RequestStatus: FC<PropsRequestsStatus> = props => {
   const { loading, error, children, loadingScaleMode = LoadingScaleMode.FillContainer } = props;
   const isLoading: boolean = Array.isArray(loading) ? loading.includes(true) : loading ?? false;
   const isError = Array.isArray(error) ? error.find(e => e != null) : error ?? null;
   const showChildren = isError == null && !isLoading;

   if (showChildren) {
      return <>{children}</>;
   }

   return (
      <RequestStatusContainer
         style={{
            height: loadingScaleMode === LoadingScaleMode.FillViewport ? "100vh" : "100%",
            padding: loadingScaleMode === LoadingScaleMode.FillContainer ? "40px" : "unset",
         }}
      >
         {isLoading && !isError && <CircularProgress color="secondary" />}
         {isError && "Error: " + tryToGetErrorMessage(isError)}
      </RequestStatusContainer>
   );
};
