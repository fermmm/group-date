import { ALL_GENDERS, Gender, User } from "../endpoints-interfaces/user";

export function getUserGenderSelection(user: Partial<User>): GenderSelection {
   return {
      subscribed: getGenderTagsTheUserIsSubscribed(user),
      blocked: getGenderTagsTheUserHasBlocked(user),
      nonBlocked: getGenderTagsTheUserDontBlock(user),
   };
}

export function getGenderTagsTheUserIsSubscribed(user: Partial<User>) {
   return (
      user?.tagsSubscribed
         ?.filter(tag => ALL_GENDERS.includes(tag.tagId as Gender))
         ?.map(tag => tag.tagId as Gender) ?? []
   );
}

export function getGenderTagsTheUserHasBlocked(user: Partial<User>) {
   return (
      user?.tagsBlocked
         ?.filter(tag => ALL_GENDERS.includes(tag.tagId as Gender))
         ?.map(tag => tag.tagId as Gender) ?? []
   );
}

export function getGenderTagsTheUserDontBlock(user: Partial<User>) {
   return ALL_GENDERS.filter(gender => user?.tagsBlocked?.find(tag => tag.tagId === gender) == null);
}

export interface GenderSelection {
   subscribed: Gender[];
   blocked: Gender[];
   nonBlocked: Gender[];
}
