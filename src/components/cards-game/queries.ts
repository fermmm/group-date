import { process } from 'gremlin';
import * as moment from 'moment';
import { __, g, order, P, retryOnError, TextP } from '../../common-tools/database-tools/database-manager';
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

// TODO: Hacer unos test en base al endpoint de test

export async function getRecommendations(user: User): Promise<process.Traverser[]> {
   let query: process.GraphTraversal = g
      .V()
      .hasLabel('user')
      .has('profileCompleted', true);

   /**
    * Was not already reviewed by the user
    */
   for (const attractionType of allAtractionTypes) {
      query = query.not(__.inE(attractionType).where(__.outV().has('token', user.token)));
   }

   /**
    * Dont show inactive accounts
    */
   query = query.not(__.has('lastLoginDate', P.lt(moment().unix() - MONTH_IN_UNIX_FORMAT * 2)));

   /**
    * User likes the gender
    */
   if (!user.likesWoman) {
      query = query.not(__.has('gender', Gender.Woman));
   }
   if (!user.likesMan) {
      query = query.not(__.has('gender', Gender.Man));
   }
   if (!user.likesWomanTrans) {
      query = query.not(__.has('gender', Gender.TransgenderWoman));
   }
   if (!user.likesManTrans) {
      query = query.not(__.has('gender', Gender.TransgenderMan));
   }
   if (!user.likesOtherGenders) {
      query = query.not(__.has('gender', Gender.Other));
   }

   /**
    * Likes the gender of the user
    */
   if (user.gender === Gender.Woman) {
      query = query.not(__.has('likesWoman', false));
   }
   if (user.gender === Gender.Man) {
      query = query.not(__.has('likesMan', false));
   }
   if (user.gender === Gender.TransgenderWoman) {
      query = query.not(__.has('likesWomanTrans', false));
   }
   if (user.gender === Gender.TransgenderMan) {
      query = query.not(__.has('likesManTrans', false));
   }
   if (user.gender === Gender.Other) {
      query = query.not(__.has('likesOtherGenders', false));
   }

   /**
    * User likes the age
    */
   query = query.not(__.has('age', P.outside(user.targetAgeMin, user.targetAgeMax)));

   /**
    * Likes the age of the user
    */
   query = query.not(__.has('targetAgeMin', P.gte(user.age)));
   query = query.not(__.has('targetAgeMax', P.lte(user.age)));

   /**
    * Is inside the distance range the user wants
    */
   query = query.not(
      __.has(
         'locationLat',
         P.outside(
            user.locationLat - user.targetDistance * KM_IN_GPS_FORMAT,
            user.locationLat + user.targetDistance * KM_IN_GPS_FORMAT,
         ),
      ),
   );
   query = query.not(
      __.has(
         'locationLon',
         P.outside(
            user.locationLon - user.targetDistance * KM_IN_GPS_FORMAT,
            user.locationLon + user.targetDistance * KM_IN_GPS_FORMAT,
         ),
      ),
   );

   /**
    * Passes the filter questions of the user
    */
   for (const question of user.questions) {
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
      const userAnswer: QuestionResponse = user.questions.find(q => q.questionId === question.questionId);
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
   query = query.order().by(order.shuffle);

   /**
    * Limit results
    */
   query = query.limit(40);

   return await retryOnError(() => addQuestionsResponded(query).toList());
}

export async function getDislikedUsers(token: string): Promise<process.Traverser[]> {
   const query: process.GraphTraversal = getUserTraversalByToken(token)
      .out(AttractionType.Dislike)
      .unfold();
   return await retryOnError(() => addQuestionsResponded(query).toList());
}
