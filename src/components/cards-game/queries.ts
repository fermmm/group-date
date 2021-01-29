import { fromAgeToBirthDate, fromBirthDateToAge } from "./../../common-tools/math-tools/date-tools";
import * as moment from "moment";
import { __, order, P } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { KM_IN_GPS_FORMAT } from "../../common-tools/math-tools/constants";
import {
   CARDS_GAME_MAX_RESULTS_PER_REQUEST_LIKING,
   CARDS_GAME_MAX_RESULTS_PER_REQUEST_OTHERS,
   MAXIMUM_INACTIVITY_FOR_CARDS,
} from "../../configurations";
import {
   allAttractionTypes,
   allMatchTypes,
   AttractionType,
   Gender,
   User,
} from "../../shared-tools/endpoints-interfaces/user";
import {
   queryToGetAllCompleteUsers,
   queryToGetUserByToken,
   queryToGetUserById,
   queryToIncludeFullInfoInUserQuery,
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
         searcherUser.locationLat - searcherUser.targetDistance * KM_IN_GPS_FORMAT,
         searcherUser.locationLat + searcherUser.targetDistance * KM_IN_GPS_FORMAT,
      ),
   );

   traversal = traversal.has(
      "locationLon",
      P.inside(
         searcherUser.locationLon - searcherUser.targetDistance * KM_IN_GPS_FORMAT,
         searcherUser.locationLon + searcherUser.targetDistance * KM_IN_GPS_FORMAT,
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
    * User likes the gender
    */
   if (!searcherUser.likesWoman) {
      traversal = traversal.has("gender", P.neq(Gender.Woman));
   }
   if (!searcherUser.likesMan) {
      traversal = traversal.has("gender", P.neq(Gender.Man));
   }
   if (!searcherUser.likesWomanTrans) {
      traversal = traversal.has("gender", P.neq(Gender.TransgenderWoman));
   }
   if (!searcherUser.likesManTrans) {
      traversal = traversal.has("gender", P.neq(Gender.TransgenderMan));
   }
   if (!searcherUser.likesOtherGenders) {
      traversal = traversal.has("gender", P.neq(Gender.Other));
   }

   /**
    * Likes the gender of the user
    */
   if (searcherUser.gender === Gender.Woman) {
      traversal = traversal.has("likesWoman", P.neq(false));
   }
   if (searcherUser.gender === Gender.Man) {
      traversal = traversal.has("likesMan", P.neq(false));
   }
   if (searcherUser.gender === Gender.TransgenderWoman) {
      traversal = traversal.has("likesWomanTrans", P.neq(false));
   }
   if (searcherUser.gender === Gender.TransgenderMan) {
      traversal = traversal.has("likesManTrans", P.neq(false));
   }
   if (searcherUser.gender === Gender.Other) {
      traversal = traversal.has("likesOtherGenders", P.neq(false));
   }

   /**
    * Here we get the searcher user so he/she will be available in the future steps as "searcherUser"
    * Also we store any data from the user that we need to have later.
    */
   traversal = traversal
      .fold()
      .as("results")
      // Get the searcher user and save it as "searcherUser"
      .union(queryToGetUserById(searcherUser.userId, __).as("searcherUser"))
      // Save all elements required later
      .sideEffect(__.out("blocked").store("blockedThemes"))
      .sideEffect(__.out("subscribed").store("subscribedThemes"))
      // Go back to the results
      .select("results")
      .unfold();

   /**
    * Is not a subscriber of any searcher blocked tags:
    */
   traversal = traversal.not(__.where(__.out("subscribed").where(P.within("blockedThemes"))));

   /**
    * Does not have blocked a subscription of the user:
    */
   traversal = traversal.not(__.where(__.out("blocked").where(P.within("subscribedThemes"))));

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

         // Sub-order by subscribed matching themes
         .by(__.out("subscribed").where(P.within("subscribedThemes")).count(), order.desc)

         // Sub-order by subscribed blocked themes
         .by(__.out("blocked").where(P.within("blockedThemes")).count(), order.desc)
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
