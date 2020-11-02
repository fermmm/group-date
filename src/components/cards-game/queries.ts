import * as moment from 'moment';
import { __, order, P, TextP } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { KM_IN_GPS_FORMAT } from '../../common-tools/math-tools/constants';
import { CARDS_GAME_MAX_RESULTS_PER_REQUEST, MAXIMUM_INACTIVITY_FOR_CARDS } from '../../configurations';
import {
   allAttractionTypes,
   allMatchTypes,
   AttractionType,
   Gender,
   QuestionResponse,
   User,
} from '../../shared-tools/endpoints-interfaces/user';
import { queryToGetAllCompleteUsers, queryToGetUserByToken, queryToGetUserById } from '../user/queries';
import { getCardOrderingQuestions, getQuestionDataById, questions } from '../user/questions/models';

export function queryToGetCardsRecommendations(
   searcherUser: User,
   traversal?: Traversal,
   hideAlreadyReviewed: boolean = true,
): Traversal {
   if (traversal == null) {
      traversal = queryToGetAllCompleteUsers();
   }

   /**
    * Is inside the distance range the user wants
    */
   traversal = traversal.has(
      'locationLat',
      P.inside(
         searcherUser.locationLat - searcherUser.targetDistance * KM_IN_GPS_FORMAT,
         searcherUser.locationLat + searcherUser.targetDistance * KM_IN_GPS_FORMAT,
      ),
   );

   traversal = traversal.has(
      'locationLon',
      P.inside(
         searcherUser.locationLon - searcherUser.targetDistance * KM_IN_GPS_FORMAT,
         searcherUser.locationLon + searcherUser.targetDistance * KM_IN_GPS_FORMAT,
      ),
   );

   /**
    * Don't show inactive accounts. Inactive means many time without login and no new users notifications pending
    */
   traversal = traversal.not(
      __.has('lastLoginDate', P.lt(moment().unix() - MAXIMUM_INACTIVITY_FOR_CARDS))
         .and()
         .has('sendNewUsersNotification', 0),
   );

   /**
    * User likes the gender
    */
   if (!searcherUser.likesWoman) {
      traversal = traversal.has('gender', P.neq(Gender.Woman));
   }
   if (!searcherUser.likesMan) {
      traversal = traversal.has('gender', P.neq(Gender.Man));
   }
   if (!searcherUser.likesWomanTrans) {
      traversal = traversal.has('gender', P.neq(Gender.TransgenderWoman));
   }
   if (!searcherUser.likesManTrans) {
      traversal = traversal.has('gender', P.neq(Gender.TransgenderMan));
   }
   if (!searcherUser.likesOtherGenders) {
      traversal = traversal.has('gender', P.neq(Gender.Other));
   }

   /**
    * Likes the gender of the user
    */
   if (searcherUser.gender === Gender.Woman) {
      traversal = traversal.has('likesWoman', P.neq(false));
   }
   if (searcherUser.gender === Gender.Man) {
      traversal = traversal.has('likesMan', P.neq(false));
   }
   if (searcherUser.gender === Gender.TransgenderWoman) {
      traversal = traversal.has('likesWomanTrans', P.neq(false));
   }
   if (searcherUser.gender === Gender.TransgenderMan) {
      traversal = traversal.has('likesManTrans', P.neq(false));
   }
   if (searcherUser.gender === Gender.Other) {
      traversal = traversal.has('likesOtherGenders', P.neq(false));
   }

   /**
    * Here we get the searcher user so he/she will be available in the future steps as "searcherUser"
    * Also we store any data from the user that we need to have later.
    */
   traversal = traversal
      .fold()
      .as('results')
      // Get the searcher user and save it as "searcherUser"
      .union(queryToGetUserById(searcherUser.userId, __).as('searcherUser'))
      // Save all elements required later
      .sideEffect(__.out('blocked').store('blockedThemes'))
      .sideEffect(__.out('subscribed').store('subscribedThemes'))
      // Go back to the results
      .select('results')
      .unfold();

   /**
    * Is not a subscriber of any searcher blocked tags:
    */
   traversal = traversal.not(__.where(__.out('subscribed').where(P.within('blockedThemes'))));

   /**
    * Was not already reviewed by the user
    */
   if (hideAlreadyReviewed) {
      traversal = traversal.not(
         __.inE(...allAttractionTypes).where(__.outV().has('token', searcherUser.token)),
      );
   }

   /**
    * It's not a Match or SeenMatch
    */
   traversal = traversal.not(
      __.bothE(...allMatchTypes).where(__.bothV().simplePath().has('token', searcherUser.token)),
   );

   /**
    * It's another user (not self)
    */
   traversal = traversal.not(__.has('userId', searcherUser.userId));

   /**
    * User likes the age
    */
   traversal = traversal.not(__.has('age', P.outside(searcherUser.targetAgeMin, searcherUser.targetAgeMax)));

   /**
    * Likes the age of the user
    */
   traversal = traversal.not(__.has('targetAgeMin', P.gt(searcherUser.age)));
   traversal = traversal.not(__.has('targetAgeMax', P.lt(searcherUser.age)));

   /**
    * Passes the filter questions of the user
    */
   for (const question of searcherUser.questions) {
      const { useAsFilter, questionId, incompatibleAnswers } = question;

      if (!useAsFilter) {
         continue;
      }

      if (incompatibleAnswers == null) {
         continue;
      }

      traversal = traversal.not(
         __.outE('response')
            .has('questionId', questionId)
            .has('answerId', P.within(...incompatibleAnswers)),
      );
   }

   /**
    * The user passes the filter questions
    */
   for (const question of questions) {
      const userAnswer: QuestionResponse = searcherUser.questions.find(
         q => q.questionId === question.questionId,
      );
      traversal = traversal.not(
         __.outE('response')
            .has('questionId', question.questionId)
            .has('useAsFilter', true)
            .has('incompatibleAnswers', TextP.containing(`${userAnswer.answerId}`)),
      );
   }

   /**
    * Order the results
    */
   traversal = queryToOrderResults(traversal, searcherUser);

   /**
    * Limit results
    */
   traversal = traversal.limit(CARDS_GAME_MAX_RESULTS_PER_REQUEST);

   return traversal;
}

export function queryToOrderResults(query: Traversal, searcherUser: User): Traversal {
   query = query
      .order()

      // Order by questions responded in the same way
      .by(
         __.outE('response')
            .or(
               ...getCardOrderingQuestions(searcherUser.questions).map(q =>
                  __.has('questionId', q.questionId).has('answerId', q.answerId),
               ),
            )
            .count(),
         order.desc,
      )

      // Sub-order by subscribed matching themes
      .by(__.out('subscribed').where(P.within('subscribedThemes')).count(), order.desc)

      // Sub-order by subscribed blocked themes
      .by(__.out('blocked').where(P.within('blockedThemes')).count(), order.desc);

   return query;
}

export function queryToGetDislikedUsers(token: string, searcherUser: User): Traversal {
   let traversal: Traversal = queryToGetUserByToken(token).out(AttractionType.Dislike);
   traversal = queryToGetCardsRecommendations(searcherUser, traversal, false);
   return traversal;
}

export function queryToGetAllUsersWantingNewCardsNotification(): Traversal {
   return queryToGetAllCompleteUsers().has('sendNewUsersNotification', P.gt(0));
}
