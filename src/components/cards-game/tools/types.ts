import { Gender } from "../../../shared-tools/endpoints-interfaces/user";

export enum CardsGameGenderBehavior {
   DoNothing,
   NeedToHave,
   HideIt,
}

export interface GenderFilterLogic {
   genderId: Gender;
   behaviorWhenWanted?: CardsGameGenderBehavior;
   behaviorWhenNotWanted?: CardsGameGenderBehavior;
}
