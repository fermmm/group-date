import { useEffect, useState } from "react";

/**
 * Adds an event listener to window to check the desired key press, removes it when the component unmounts.
 *
 * @param targetKey The value of event.key. You can get the value in https://keycode.info/ or any "key code checker"
 * @param settings You can configure if you want to add shift or other key as a combination. Be aware that when holding shift the "key" code is different for some keys.
 */
export function useKeyPress(
   targetKey: string,
   settings?: { withShift?: boolean; withCtrl?: boolean; withAlt?: boolean },
) {
   const { withShift = false, withCtrl = false, withAlt = false } = settings ?? {};

   // State for keeping track of whether key is pressed
   const [keyPressed, setKeyPressed] = useState<boolean>(false);

   // If pressed key is our target key then set to true
   const downHandler = (e: KeyboardEvent) => {
      if (e.shiftKey !== withShift || e.ctrlKey !== withCtrl || e.altKey !== withAlt) {
         return;
      }
      if (e.key === targetKey) {
         setKeyPressed(true);
      }
   };

   // If released key is our target key then set to false
   const upHandler = (e: KeyboardEvent) => {
      if (e.key === targetKey) {
         setKeyPressed(false);
      }
   };

   // Add event listeners
   useEffect(() => {
      window.addEventListener("keydown", downHandler);
      window.addEventListener("keyup", upHandler);
      // Remove event listeners on cleanup
      return () => {
         window.removeEventListener("keydown", downHandler);
         window.removeEventListener("keyup", upHandler);
      };
   }, []); // Empty array ensures that effect is only run on mount and unmount

   return keyPressed;
}
