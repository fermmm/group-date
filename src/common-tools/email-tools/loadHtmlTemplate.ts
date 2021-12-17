import * as nunjucks from "nunjucks";

/**
 *
 * @param applyStandardVariables Default: true: Replaces variables for the logo url and other standard urls
 * @returns
 */
export function loadHtmlTemplate<T extends object>(props: {
   htmlFilePath: string;
   variablesToReplace: T;
   applyStandardVariables?: boolean;
}): string {
   const { htmlFilePath, variablesToReplace, applyStandardVariables = true } = props;

   nunjucks.configure({ autoescape: true });
   return nunjucks.render(htmlFilePath, variablesToReplace);
}

export function getStandardUrls() {
   return {
      logoUrl: "https://www.nhs.uk/live/design/favicon/apple-touch-icon-precomposed.png",
   };
}
