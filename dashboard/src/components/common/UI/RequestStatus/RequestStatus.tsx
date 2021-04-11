import CircularProgress from "@material-ui/core/CircularProgress";
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
   FillContainer
}

export const RequestsStatus: FC<PropsRequestsStatus> = props => {
   const { loading, error, children, loadingScaleMode = LoadingScaleMode.FillViewport } = props;
   const isLoading: boolean = Array.isArray(loading) ? loading.includes(true) : loading ?? false;
   const isError = Array.isArray(error) ? error.find(e => e != null) : error ?? null;

   if (isError == null && !isLoading) {
      return <>{children}</>;
   }

   return (
      <RequestStatusContainer
         style={{
            height: loadingScaleMode === LoadingScaleMode.FillViewport ? "100vh" : "100%"
         }}
      >
         {isLoading && !isError && <CircularProgress color="inherit" />}
         {isError && "Error: " + tryToGetErrorMessage(isError)}
      </RequestStatusContainer>
   );
};
