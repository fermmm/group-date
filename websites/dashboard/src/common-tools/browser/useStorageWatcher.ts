import { useEffect, useState } from "react";

function storageValueExists(value: string) {
   return localStorage.getItem(value) != null;
}

/**
 * Checks for localStorage value existence and re-renders the component when that changes.
 */
export const useStorageValueExistsWatcher = (value: string, pollingRate = 150) => {
   const [exist, setExist] = useState(storageValueExists(value));

   useEffect(() => {
      const interval = setInterval(() => setExist(storageValueExists(value)), pollingRate);
      return () => clearInterval(interval);
   });

   return exist;
};

/**
 * Checks for localStorage value changes and re-renders the component on change.
 */
export const useLocalStorageValueWatcher = (item: string, pollingRate = 150) => {
   const [value, setValue] = useState<string>(localStorage.getItem(item));

   useEffect(() => {
      const interval = setInterval(() => {
         const newStorageValue = localStorage.getItem(item);
         if (newStorageValue !== value) {
            setValue(newStorageValue);
         }
      }, pollingRate);
      return () => clearInterval(interval);
   });

   return value;
};
