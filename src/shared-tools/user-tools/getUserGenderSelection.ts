import { Gender, User } from "../endpoints-interfaces/user";

export function getUserGenderSelection(user: Partial<User>): GenderSelection {
   const allGenders = Object.values(Gender);
   return {
      subscribed: getGenderTagsTheUserIsSubscribed(user, allGenders),
      blocked: getGenderTagsTheUserHasBlocked(user, allGenders),
      nonBlocked: getGenderTagsTheUserDontBlock(user, allGenders),
   };
}

export function getGenderTagsTheUserIsSubscribed(user: Partial<User>, allGenders: Gender[]) {
   return (
      user?.tagsSubscribed
         ?.filter(tag => allGenders.includes(tag.tagId as Gender))
         ?.map(tag => tag.tagId as Gender) ?? []
   );
}

export function getGenderTagsTheUserHasBlocked(user: Partial<User>, allGenders: Gender[]) {
   return (
      user?.tagsBlocked
         ?.filter(tag => allGenders.includes(tag.tagId as Gender))
         ?.map(tag => tag.tagId as Gender) ?? []
   );
}

export function getGenderTagsTheUserDontBlock(user: Partial<User>, allGenders: Gender[]) {
   return allGenders.filter(gender => user?.tagsBlocked?.find(tag => tag.tagId === gender) == null);
}

export interface GenderSelection {
   subscribed: Gender[];
   blocked: Gender[];
   nonBlocked: Gender[];
}
