import * as nunjucks from "nunjucks";
import { APPLICATION_NAME_COMPLETE, APP_STORE_URL, GOOGLE_PLAY_URL } from "../../configurations";
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

export function getStandardUrls(translationSources: LocaleConfigurationSources): EmailTemplateVariables {
   const emailImagesFolderUrl = getServerUrl() + "/email-images/";

   return {
      title: "",
      content: "",
      footerText: t(APPLICATION_NAME_COMPLETE, translationSources),
      logoUrl: emailImagesFolderUrl + "logo.svg",
      googlePlayImageUrl: emailImagesFolderUrl + "buttonGooglePlay.svg",
      appStoreImageUrl: emailImagesFolderUrl + "appStoreButton.svg",
      googlePlayUrl: GOOGLE_PLAY_URL,
      appStoreUrl: APP_STORE_URL,
   };
}

export interface EmailTemplateVariables {
   title?: string;
   content?: string;
   footerText?: string;
   logoUrl?: string;
   googlePlayImageUrl?: string;
   appStoreImageUrl?: string;
   googlePlayUrl?: string;
   appStoreUrl?: string;
}
