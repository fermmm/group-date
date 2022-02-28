import { fromAgeToBirthDate, fromBirthDateToAge } from "./../../common-tools/math-tools/date-tools";
import * as moment from "moment";
import { __, order, P } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { GPS_TO_KM, KM_TO_GPS } from "../../common-tools/math-tools/constants";
import {
   CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING,
   CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS,
   MAXIMUM_INACTIVITY_FOR_CARDS,
} from "../../configurations";
import {
   allAttractionTypes,
   allMatchTypes,
   AttractionType,
   CIS_GENDERS,
   Gender,
   TRANS_GENDERS,
   User,
} from "../../shared-tools/endpoints-interfaces/user";
import {
   queryToGetAllCompleteUsers,
   queryToGetUserByToken,
   queryToGetUserById,
   queryToIncludeFullInfoInUserQuery,
   queryToGetAllDemoUsers,
} from "../user/queries";

export function queryToGetCardsRecommendations(
   searcherUser: User,
   settings?: {
      traversal?: Traversal;
      showAlreadyReviewed?: boolean;
      singleListResults?: boolean;
      unordered?: boolean;
   },
): Traversal {
   let traversal: Traversal = settings?.traversal ?? queryToGetAllCompleteUsers();

   /**
    * Is inside the distance range the user wants
    */
   traversal = traversal.has(
      "locationLat",
      P.inside(
         searcherUser.locationLat - searcherUser.targetDistance * KM_TO_GPS,
         searcherUser.locationLat + searcherUser.targetDistance * KM_TO_GPS,
      ),
   );

   traversal = traversal.has(
      "locationLon",
      P.inside(
         searcherUser.locationLon - searcherUser.targetDistance * KM_TO_GPS,
         searcherUser.locationLon + searcherUser.targetDistance * KM_TO_GPS,
      ),
   );

   /**
    * Don't show inactive accounts. Inactive means many time without login and no new users notifications pending
    */
   traversal = traversal.not(
      __.has("lastLoginDate", P.lt(moment().unix() - MAXIMUM_INACTIVITY_FOR_CARDS))
         .and()
         .has("sendNewUsersNotification", P.lt(1)),
   );

   /**
    * Has the genders wanted by the user
    */
   traversal = queryToFilterByLikedGender(traversal, searcherUser.likesGenders);

   /**
    * The users wants the searcher genders
    */
   traversal = queryToFilterUsersNotLikingSearcherGenders(traversal, searcherUser.genders);

   /**
    * Was not already reviewed by the user
    */
   if (!settings?.showAlreadyReviewed) {
      traversal = traversal.not(
         __.inE(...allAttractionTypes).where(__.outV().has("token", searcherUser.token)),
      );
   }

   /**
    * It's not a Match or SeenMatch
    */
   traversal = traversal.not(
      __.bothE(...allMatchTypes).where(__.bothV().simplePath().has("token", searcherUser.token)),
   );

   /**
    * Here we get the searcher user so he/she will be available in the future traversal steps as "searcherUser"
    * Also we store any data from the user that we need to have later.
    */
   traversal = traversal
      .fold()
      .as("results")
      // Get the searcher user and save it as "searcherUser"
      .union(queryToGetUserById(searcherUser.userId, __).as("searcherUser"))
      // Save all elements required later
      .sideEffect(__.out("blocked").store("blockedTags"))
      .sideEffect(__.out("subscribed").store("subscribedTags"))
      // Go back to the results
      .select("results")
      .unfold();

   /**
    * Is not a subscriber of any searcher blocked tags:
    */
   traversal = traversal.not(__.where(__.out("subscribed").where(P.within("blockedTags"))));

   /**
    * Does not have blocked a subscription of the user:
    */
   traversal = traversal.not(__.where(__.out("blocked").where(P.within("subscribedTags"))));

   /**
    * Is not blocked by the searcher user
    */
   traversal = traversal.not(__.inE("blockedUser").outV().as("searcherUser"));

   /**
    * It's another user (not self)
    */
   traversal = traversal.not(__.has("userId", searcherUser.userId));

   /**
    * User likes the age
    */
   traversal = traversal.not(
      __.has(
         "birthDate",
         P.outside(
            fromAgeToBirthDate(searcherUser.targetAgeMax),
            fromAgeToBirthDate(searcherUser.targetAgeMin),
         ),
      ),
   );

   /**
    * Likes the age of the user
    */
   const searcherUserAge = fromBirthDateToAge(searcherUser.birthDate);
   traversal = traversal.not(__.has("targetAgeMin", P.gt(searcherUserAge)));
   traversal = traversal.not(__.has("targetAgeMax", P.lt(searcherUserAge)));

   /**
    * The user is inside the distance the result wants
    * For testing of this weird syntax: https://gremlify.com/sva6t6120s
    * This is here to make sure this is done after filtering most users
    */
   traversal = traversal
      .as("a")
      .where(P.gte("a"))
      .by("targetDistance")
      .by(__.math(`abs(_ - ${searcherUser.locationLat}) * ${GPS_TO_KM}`).by("locationLat"));

   traversal = traversal
      .as("a")
      .where(P.gte("a"))
      .by("targetDistance")
      .by(__.math(`abs(_ - ${searcherUser.locationLon}) * ${GPS_TO_KM}`).by("locationLon"));

   /**
    * User is not banned
    */
   traversal = traversal.not(__.has("banReasonsAmount", P.gt(0)));

   /**
    * User has images
    */
   traversal = traversal.has("imagesAmount", P.gt(0));

   /**
    * Order the results
    */
   if (!settings?.unordered) {
      traversal = queryToOrderResults(traversal, searcherUser);
   }

   /**
    * Create an output with 2 users list, the ones that likes the user and the others
    */
   if (!settings?.singleListResults) {
      traversal = queryToDivideLikingUsers(traversal, searcherUser);
   } else {
      traversal = traversal.limit(CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS);
   }

   return traversal;
}

/**
 * Not all the genders are covered by the same logic here because some genders contain information about the
 * user's genitals, others describe a feeling.
 * The users who don't care about genitals usually configures the app to not filter any gender and that's all.
 * But there are users interested in filtering by genitals, to enable this all users must select at least one
 * cis gender in the gender selection screen and also in the wanted gender screen. This is a way of specifying
 * the genitals without asking directly. Users can filter cis and trans genders because contains information
 * about genitals. The rest of the genders are not related to any filtering logic because it's not useful and
 * to keep code simple and efficient.
 *
 * With this concept in mind, this is how it works:
 *
 *    There are 3 logic types applied to the genders without asking the user:
 *       "I need this gender", "Filter this gender" and "I don't care"
 *
 *    "I need this gender" = For selected cis genders: Users must have at least one of the cis genders that the searcher wants. Because hetero couples usually selects both cis genders and that should not be a problem.
 *    "Filter this gender" = For not selected trans genders: Transgender users with a trans gender that the searcher don't like are filtered out.
 *    "I don't care" = For the rest of the genders: Can't be filtered, no programming required.
 *
 * For testing:
 * https://gremlify.com/jkmf8yt8zzg
 */
export function queryToFilterByLikedGender(traversal: Traversal, likedGenders: Gender[]): Traversal {
   const selectedCisGenders = likedGenders.filter(gender => CIS_GENDERS.includes(gender));
   const notSelectedTransGenders = [...TRANS_GENDERS].filter(gender => !likedGenders.includes(gender));

   // Pick the users that has al least one of the cis genders selected
   if (selectedCisGenders.length > 0) {
      traversal = traversal.where(
         __.or(...selectedCisGenders.map(gender => __.out("isGender").has("genderId", gender))),
      );
   }

   // Remove users that has a trans gender that is not selected
   if (notSelectedTransGenders.length > 0) {
      traversal = traversal.not(
         __.where(__.or(...notSelectedTransGenders.map(gender => __.out("isGender").has("genderId", gender)))),
      );
   }

   return traversal;
}

/**
 * To understand why this works like it does read the comment of queryToFilterByLikedGender() function.
 *
 * For testing:
 * https://gremlify.com/qzmyc00lsqh
 */
export function queryToFilterUsersNotLikingSearcherGenders(
   traversal: Traversal,
   searcherGenders: Gender[],
): Traversal {
   const searcherCisGenders = searcherGenders.filter(gender => CIS_GENDERS.includes(gender));
   const searcherTransGenders = searcherGenders.filter(gender => TRANS_GENDERS.includes(gender));

   // User likes one of the searcher cis genders
   if (searcherCisGenders.length > 0) {
      traversal = traversal.where(
         __.or(...searcherCisGenders.map(gender => __.out("likesGender").has("genderId", gender))),
      );
   }

   // User likes all searcher trans genders (if any)
   if (searcherTransGenders.length > 0) {
      traversal = traversal.where(
         __.and(...searcherTransGenders.map(gender => __.out("likesGender").has("genderId", gender))),
      );
   }

   return traversal;
}

export function queryToOrderResults(traversal: Traversal, searcherUser: User): Traversal {
   return (
      traversal
         /**
          * This shuffle avoids 2 similar users getting the same result giving more visibility
          * to the first users in that case just because they are lucky.
          * Shuffle needs it's own order() and needs to be at the beginning.
          */
         .order()
         .by(order.shuffle)

         .order()

         // Sub-order by subscribed matching tags
         .by(__.out("subscribed").where(P.within("subscribedTags")).count(), order.desc)

         // Sub-order by subscribed blocked tags
         .by(__.out("blocked").where(P.within("blockedTags")).count(), order.desc)
   );
}

export function queryToDivideLikingUsers(traversal: Traversal, searcherUser: User): Traversal {
   return traversal
      .group()
      .by(
         __.choose(
            __.out(AttractionType.Like).has("userId", searcherUser.userId),
            __.constant("liking"),
            __.constant("others"),
         ),
      )
      .project("liking", "others")
      .by(
         queryToIncludeFullInfoInUserQuery(__.select("liking").unfold())
            .limit(CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING)
            .fold(),
      )
      .by(
         queryToIncludeFullInfoInUserQuery(__.select("others").unfold())
            .limit(CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS)
            .fold(),
      );
}

export function queryToGetDislikedUsers(props: {
   token: string;
   searcherUser: User;
   invertOrder?: boolean;
}): Traversal {
   const { token, searcherUser, invertOrder } = props;

   let traversal: Traversal = queryToGetUserByToken(token)
      .outE(AttractionType.Dislike)
      .order()
      .by("timestamp", invertOrder === true ? order.desc : order.asc)
      .inV();

   traversal = queryToGetCardsRecommendations(searcherUser, {
      traversal,
      showAlreadyReviewed: true,
      unordered: true,
      singleListResults: true,
   });

   return traversal;
}

export function queryToGetAllUsersWantingNewCardsNotification(): Traversal {
   return queryToGetAllCompleteUsers().has("sendNewUsersNotification", P.gt(0));
}

/**
 * This function could return the demo accounts and that is all but this is useful to test filters.
 */
export function queryToGetDemoCardsRecommendations(searcherUser: User) {
   let traversal: Traversal = queryToGetAllDemoUsers();

   /**
    * User is not banned
    */
   traversal = traversal.not(__.has("banReasonsAmount", P.gt(0)));

   /**
    * It's another user (not self)
    */
   traversal = traversal.not(__.has("userId", searcherUser.userId));

   /**
    * User has images
    */
   traversal = traversal.has("imagesAmount", P.gt(0));

   return traversal;
}
