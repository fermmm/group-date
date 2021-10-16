export interface PresetQueryItem {
   query: string;
   name?: string;
   category?: string;
   carrotPos?: number;
   carrotPosStart?: number;
   carrotPosEnd?: number;
}

const queryPresetsByCategory: Array<{ categoryName: string; presets: PresetQueryItem[] }> = [
   {
      categoryName: "Newest",
      presets: [
         {
            name: "Newest users",
            query:
               'g.V().hasLabel("user").has("profileCompleted", true).order().by(coalesce(values("registrationDate"), values("lastGroupJoinedDate")), desc)'
         },
         {
            name: "Newest woman",
            query:
               'g.V().hasLabel("user").has("profileCompleted", true).order().by(coalesce(values("registrationDate"), values("lastGroupJoinedDate")), desc).where(out("isGender").has("genderId", "Woman")).has("isCoupleProfile", false)'
         },
         {
            name: "Newest man",
            query:
               'g.V().hasLabel("user").has("profileCompleted", true).order().by(coalesce(values("registrationDate"), values("lastGroupJoinedDate")), desc).where(out("isGender").has("genderId", "Man")).has("isCoupleProfile", false)'
         },
         {
            name: "Newest couples",
            query:
               'g.V().hasLabel("user").has("profileCompleted", true).order().by(coalesce(values("registrationDate"), values("lastGroupJoinedDate")), desc).has("isCoupleProfile", true)'
         },
         {
            name: "Newest tags",
            query: 'g.V().hasLabel("tag").order().by("creationDate", desc).has("global", false)'
         },
         {
            name: "Newest matches",
            query: 'g.E().hasLabel("Match").order().by("timestamp", desc).bothV()'
         },
         {
            name: "Newest groups",
            query: 'g.V().hasLabel("group").order().by("creationDate", desc)'
         }
      ]
   },
   {
      categoryName: "Matches",
      presets: [
         {
            name: "All matches",
            query: 'g.E().hasLabel("Match").bothV()'
         }
      ]
   }
];

export const queryPresets = getQueryPresets();

function getQueryPresets(): PresetQueryItem[] {
   const result: PresetQueryItem[] = [];

   queryPresetsByCategory.forEach(category => {
      category.presets.forEach(preset =>
         result.push({ ...preset, category: category.categoryName })
      );
   });

   return result;
}

export function getStartingPreset(): PresetQueryItem {
   return {
      query: 'g.V().has("name", "")',
      carrotPos: 19
   };
}

export function getCarrotPos(query: string): { start: number; end: number } {
   if (query == null) {
      return { start: 0, end: 0 };
   }

   let preset = queryPresets.find(preset => preset.query === query);

   if (preset == null) {
      preset = getStartingPreset();

      if (preset == null) {
         return { start: 0, end: 0 };
      }
   }

   if (preset.carrotPos != null) {
      return { start: preset.carrotPos, end: preset.carrotPos };
   }

   if (preset.carrotPosStart != null && preset.carrotPosEnd != null) {
      return { start: preset.carrotPosStart, end: preset.carrotPosEnd };
   }

   return { start: 0, end: 0 };
}
