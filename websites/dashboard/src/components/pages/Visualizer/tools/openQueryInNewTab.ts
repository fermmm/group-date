import { createUrlParamString } from "../../../../common-tools/browser/url-tools";

export function openQueryInNewTab(query: string) {
   window.open(
      `${window.location.origin}${window.location.pathname}?${createUrlParamString(
         "visualizer-search",
         query,
      )}`,
      "_blank",
   );
}
