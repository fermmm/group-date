export type SettingIds = "showDecoded";
export type SettingTypes = "boolean";

const globalSettings: Record<SettingIds, GlobalSetting> = {
   showDecoded: {
      type: "boolean",
      default: true,
      description: "Show props encoded in the visualizer panel",
      detailedDescription:
         "In the database props are saved encoded using encodeURI(), the dashboard visualizer reads directly from database, so the data is not easy to read, enable this so the dashboard decodes the database values before showing them",
   },
};

export function getGlobalSettingValue<T = any>(settingId: SettingIds): T {
   const itemAsString = localStorage.getItem(settingId);

   if (!itemAsString) {
      return globalSettings?.[settingId]?.default;
   }

   if (globalSettings[settingId].type === "boolean") {
      return (itemAsString === "true") as unknown as T;
   }

   return itemAsString as unknown as T;
}

export function setGlobalSetting(settingId: SettingIds, value: any) {
   let valueToSave = value;

   if (globalSettings[settingId].type === "boolean") {
      valueToSave = String(value);
   }

   localStorage.setItem(settingId, valueToSave); // This only accepts strings
}

export function getAllGlobalSettings(): Partial<Record<SettingIds, any>> {
   const result: Partial<Record<SettingIds, any>> = {};

   (Object.keys(globalSettings) as SettingIds[]).forEach(settingId => {
      result[settingId] = getGlobalSettingValue(settingId);
   });

   return result;
}

export interface GlobalSetting<T = any> {
   type: SettingTypes;
   default?: T;
   description: "Show props encoded in the visualizer panel";
   detailedDescription?: "In the database props are saved encoded using encodeURI(), the dashboard visualizer reads directly from database, so the data is not easy to read, enable this so the dashboard decodes the database values before showing them";
}
