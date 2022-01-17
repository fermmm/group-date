import { isProductionMode } from "../process/process-tools";

export function getImagesHostUrl() {
   if (isProductionMode()) {
      return process.env.IMAGES_HOST;
   } else {
      return process.env.IMAGES_HOST_DEVELOPMENT;
   }
}
