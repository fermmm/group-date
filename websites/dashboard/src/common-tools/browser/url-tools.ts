import { useCallback, useEffect, useState } from "react";

export function setUrlParameter(props: { key: string; value: string }) {
   const { key, value } = props;
   var queryParams = new URLSearchParams(window.location.search);
   queryParams.set(key, value);
   window.history.pushState(null, null, "?" + queryParams.toString());
}

export function getUrlParameter(key: string) {
   var queryParams = new URLSearchParams(window.location.search);
   return queryParams.get(key);
}

export function createUrlParamString(key: string, value: string) {
   var queryParams = new URLSearchParams();
   queryParams.set(key, value);
   return queryParams.toString();
}

/**
 * Checks for url parameter value changes and re-renders the component on change.
 */
export const useUrlParameterWatcher = (key: string, pollingRate = 150) => {
   const [value, setValue] = useState<string>(getUrlParameter(key));

   useEffect(() => {
      const interval = setInterval(() => {
         const newStorageValue = getUrlParameter(key);
         if (newStorageValue !== value) {
            setValue(newStorageValue);
         }
      }, pollingRate);
      return () => clearInterval(interval);
   });

   return value;
};

export default function useUserChangesUrlWatcher(onChange: () => void, passive = false) {
   const handlePopState = useCallback(() => onChange(), []);

   useEffect(() => {
      // initiate the event handler
      window.addEventListener("popstate", handlePopState, passive);

      // this will clean up the event every time the component is re-rendered
      return function cleanup() {
         window.removeEventListener("popstate", handlePopState);
      };
   });
}
