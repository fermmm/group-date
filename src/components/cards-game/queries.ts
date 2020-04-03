import { process } from 'gremlin';
import * as moment from 'moment';
import { __, column, g, order, P, retryOnError, TextP } from '../../common-tools/database-tools/database-manager';
import { UserFromDatabase } from '../../common-tools/database-tools/gremlin-typing-tools';
import { KM_IN_GPS_FORMAT, MONTH_IN_UNIX_FORMAT } from '../../common-tools/math-tools/math-tools';
import {
   allAtractionTypes,
   AttractionType,
   Gender,
   QuestionResponse,
   User,
} from '../../shared-tools/endpoints-interfaces/user';
import { addQuestionsResponded, getUserTraversalByToken } from '../common/queries';
import { questions } from '../user/questions/models';

const RESULTS_LIMIT: number = 40;

export async function getRecommendations(searcherUser: User): Promise<UserFromDatabase[]> {
   let query: process.GraphTraversal = g
      .V()
      .hasLabel('user')
      .has('profileCompleted', true);

   /**
    * It's another user (not self)
    */
   query = query.not(__.has('userId', searcherUser.userId));

   /**
    * Was not already reviewed by the user
    */
   for (const attractionType of allAtractionTypes) {
      query = query.not(__.inE(attractionType).where(__.outV().has('token', searcherUser.token)));
   }

   /**
    * Dont show inactive accounts
    */
   query = query.not(__.has('lastLoginDate', P.lt(moment().unix() - MONTH_IN_UNIX_FORMAT)));

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
   query = query.not(__.has('targetAgeMin', P.gte(searcherUser.age)));
   query = query.not(__.has('targetAgeMax', P.lte(searcherUser.age)));

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
      const userAnswer: QuestionResponse = searcherUser.questions.find(q => q.questionId === question.questionId);
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
   query = orderResultsByMatchingQuestionAnswers(query, searcherUser);

   /**
    * Limit results
    */
   query = query.limit(RESULTS_LIMIT);

   return (await retryOnError(() => addQuestionsResponded(query).toList())) as UserFromDatabase[];
}

export async function getDislikedUsers(token: string, searcherUser: User): Promise<UserFromDatabase[]> {
   let query: process.GraphTraversal = getUserTraversalByToken(token).out(AttractionType.Dislike);

   /**
    * Filter inactive accounts
    */
   query = query.not(__.has('lastLoginDate', P.lt(moment().unix() - MONTH_IN_UNIX_FORMAT)));

   /**
    * Order the results
    */
   query = orderResultsByMatchingQuestionAnswers(query, searcherUser);

   /**
    * Limit results
    */
   query = query.limit(RESULTS_LIMIT);

   return (await retryOnError(() => addQuestionsResponded(query).toList())) as UserFromDatabase[];
}

function orderResultsByMatchingQuestionAnswers(
   query: process.GraphTraversal,
   searcherUser: User,
): process.GraphTraversal {
   query = query.outE('response');
   const sameResponsesFilter = searcherUser.questions.map(searcherQuestion =>
      __.has('questionId', searcherQuestion.questionId).has('answerId', searcherQuestion.answerId),
   );
   // Without this hack the users with 0 matches are removed from the results. I want them on the bottom not removed:
   sameResponsesFilter.push(__.has('questionId', searcherUser.questions[0].questionId));

   return query
      .or(...sameResponsesFilter)
      .groupCount()
      .by(__.outV())
      .unfold()
      .order()
      .by(column.values, order.desc)
      .select(column.keys);
}
