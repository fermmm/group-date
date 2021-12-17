import * as nunjucks from "nunjucks";
import { APPLICATION_NAME_COMPLETE } from "../../configurations";
import { LocaleConfigurationSources, t } from "../i18n-tools/i18n-tools";
import { getServerUrl } from "../url-tools/getServerUrl";

/**
 * Returns an html file as string with styles. Contains variables in format: {{ variable }} to be
 * replaced by the values in the variablesToReplace object.
 */
export function loadHtmlEmailTemplate(props: {
   htmlFilePath?: string;
   variablesToReplace: EmailTemplateVariables;
   translationSources: LocaleConfigurationSources;
}): string {
   const {
      htmlFilePath = "websites/email-templates/general.html",
      variablesToReplace,
      translationSources,
   } = props;

   nunjucks.configure({ autoescape: true });
   return nunjucks.render(htmlFilePath, { ...getStandardUrls(translationSources), ...variablesToReplace });
}

// TODO: Terminar de resolver como completar estas variables
export function getStandardUrls(translationSources: LocaleConfigurationSources): EmailTemplateVariables {
   return {
      title: "",
      content: "",
      footerText: t(APPLICATION_NAME_COMPLETE, translationSources),
      logoUrl: `${getServerUrl()}/images/logo.png`,
      googlePlayUrl: "https://sarasa.png",
      appStoreUrl: "",
      googlePlayImageUrl: "https://sarasa.png",
      appStoreImageUrl: "",
   };
}

export interface EmailTemplateVariables {
   title?: string;
   content?: string;
   footerText?: string;
   logoUrl?: string;
   googlePlayUrl?: string;
   appStoreUrl?: string;
   googlePlayImageUrl?: string;
   appStoreImageUrl?: string;
}
