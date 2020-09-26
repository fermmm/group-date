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
import { queryToGetAllCompleteUsers, queryToGetUserByToken } from '../user/queries';
import { getQuestionDataById, questions } from '../user/questions/models';

export function queryToGetCardsRecommendations(searcherUser: User): Traversal {
   let query: Traversal = queryToGetAllCompleteUsers();

   /**
    * Is inside the distance range the user wants
    */
   query = query.not(
      __.has(
         'locationLat',
         P.outside(
            searcherUser.locationLat - searcherUser.targetDistance * KM_IN_GPS_FORMAT,
            searcherUser.locationLat + searcherUser.targetDistance * KM_IN_GPS_FORMAT,
         ),
      ),
   );
   query = query.not(
      __.has(
         'locationLon',
         P.outside(
            searcherUser.locationLon - searcherUser.targetDistance * KM_IN_GPS_FORMAT,
            searcherUser.locationLon + searcherUser.targetDistance * KM_IN_GPS_FORMAT,
         ),
      ),
   );

   /**
    * Don't show inactive accounts. Inactive means many time without login and no new users notifications pending
    */
   query = query.not(
      __.has('lastLoginDate', P.lt(moment().unix() - MAXIMUM_INACTIVITY_FOR_CARDS))
         .and()
         .has('sendNewUsersNotification', 0),
   );

   /**
    * Was not already reviewed by the user
    */
   query = query.not(__.inE(...allAttractionTypes).where(__.outV().has('token', searcherUser.token)));

   /**
    * It's not a Match or SeenMatch
    */
   query = query.not(
      __.bothE(...allMatchTypes).where(__.bothV().simplePath().has('token', searcherUser.token)),
   );

   /**
    * It's another user (not self)
    */
   query = query.not(__.has('userId', searcherUser.userId));

   /**
    * User likes the gender
    */
   if (!searcherUser.likesWoman) {
      query = query.not(__.has('gender', Gender.Woman));
   }
   if (!searcherUser.likesMan) {
      query = query.not(__.has('gender', Gender.Man));
   }
   if (!searcherUser.likesWomanTrans) {
      query = query.not(__.has('gender', Gender.TransgenderWoman));
   }
   if (!searcherUser.likesManTrans) {
      query = query.not(__.has('gender', Gender.TransgenderMan));
   }
   if (!searcherUser.likesOtherGenders) {
      query = query.not(__.has('gender', Gender.Other));
   }

   /**
    * Likes the gender of the user
    */
   if (searcherUser.gender === Gender.Woman) {
      query = query.not(__.has('likesWoman', false));
   }
   if (searcherUser.gender === Gender.Man) {
      query = query.not(__.has('likesMan', false));
   }
   if (searcherUser.gender === Gender.TransgenderWoman) {
      query = query.not(__.has('likesWomanTrans', false));
   }
   if (searcherUser.gender === Gender.TransgenderMan) {
      query = query.not(__.has('likesManTrans', false));
   }
   if (searcherUser.gender === Gender.Other) {
      query = query.not(__.has('likesOtherGenders', false));
   }

   /**
    * User likes the age
    */
   query = query.not(__.has('age', P.outside(searcherUser.targetAgeMin, searcherUser.targetAgeMax)));

   /**
    * Likes the age of the user
    */
   query = query.not(__.has('targetAgeMin', P.gt(searcherUser.age)));
   query = query.not(__.has('targetAgeMax', P.lt(searcherUser.age)));

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

      query = query.not(
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
      query = query.not(
         __.outE('response')
            .has('questionId', question.questionId)
            .has('useAsFilter', true)
            .has('incompatibleAnswers', TextP.containing(`${userAnswer.answerId}`)),
      );
   }

   /**
    * Order the results
    */
   query = queryToOrderResultsByMatchingQuestions(query, searcherUser);

   /**
    * Limit results
    */
   query = query.limit(CARDS_GAME_MAX_RESULTS_PER_REQUEST);

   return query;
}

export function queryToGetDislikedUsers(token: string, searcherUser: User): Traversal {
   let query: Traversal = queryToGetUserByToken(token).out(AttractionType.Dislike);

   /**
    * Filter inactive accounts
    */
   query = query.not(
      __.has('lastLoginDate', P.lt(moment().unix() - MAXIMUM_INACTIVITY_FOR_CARDS))
         .and()
         .has('sendNewUsersNotification', 0),
   );

   /**
    * Order the results
    */
   query = queryToOrderResultsByMatchingQuestions(query, searcherUser);

   /**
    * Limit results
    */
   query = query.limit(CARDS_GAME_MAX_RESULTS_PER_REQUEST);

   return query;
}

export function queryToOrderResultsByMatchingQuestions(query: Traversal, searcherUser: User): Traversal {
   query = query.project('userVertex', 'count').by();

   const sameResponsesFilter = [];
   for (const searcherQuestion of searcherUser.questions) {
      if (!getQuestionDataById(searcherQuestion.questionId).affectsCardsGameOrdering) {
         continue;
      }
      sameResponsesFilter.push(
         __.has('questionId', searcherQuestion.questionId).has('answerId', searcherQuestion.answerId),
      );
   }

   query = query
      .by(
         __.outE('response')
            .or(...sameResponsesFilter)
            .count(),
      )
      .order()
      .by(__.select('count'), order.desc)
      .select('userVertex');

   return query;
}

export function queryToGetAllUsersWantingNewCardsNotification(): Traversal {
   return queryToGetAllCompleteUsers().has('sendNewUsersNotification', P.gt(0));
}
