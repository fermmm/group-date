import { Gender, User } from "../endpoints-interfaces/user";

export function getUserGenderSelection(user: Partial<User>) {
   const genderIds = Object.values(Gender);
   return {
      subscribed:
         user?.tagsSubscribed
            ?.filter(tag => genderIds.includes(tag.tagId as Gender))
            ?.map(tag => tag.tagId as Gender) ?? [],
      blocked:
         user?.tagsBlocked
            ?.filter(tag => genderIds.includes(tag.tagId as Gender))
            ?.map(tag => tag.tagId as Gender) ?? [],
   };
}
