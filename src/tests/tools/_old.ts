/**
 * This version of createFakeUsers creates many users on the same database request but seems to
 * be a limit in the amount of data per request, if this limit is passed the request never responds.
 * The solution is to call many requests of 40 users each. I compared the performance and it's not
 * much better than one request per user so I save in this file the code and the queries I did for
 * this approach, just in case I need something from here in the future.
 */

import { queryToCreateVerticesFromObjects } from '../../common-tools/database-tools/common-queries';
import { __, g, P, sendQuery } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { numberChunksCallback } from '../../common-tools/js-tools/js-tools';
import { getIncompatibleAnswers } from '../../components/user/questions/models';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { generateRandomUserProps } from './users';

const fakeUsersCreated: User[] = [];

export async function createFakeUsers2(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const usersCreated: User[] = [];

   numberChunksCallback(amount, 40, async amountForRequest => {
      usersCreated.push(...(await generateAndCreateFakeUsers(amountForRequest, customParams)));
   });

   return usersCreated;
}

export async function createFakeUser2(customParams?: Partial<User>): Promise<User> {
   return (await generateAndCreateFakeUsers(1, customParams))[0];
}

async function generateAndCreateFakeUsers(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const users: User[] = [];
   const usersWithoutQuestions: User[] = [];
   const finalParams = { ...(customParams ?? {}) };

   if (amount > 1) {
      // userId, token and email should be null here otherwise instead of creating each user it will replace the first one
      delete finalParams?.userId;
      delete finalParams?.token;
      delete finalParams?.email;
   }

   for (let i = 0; i < amount; i++) {
      const usr = generateRandomUserProps(finalParams);
      const usrWithoutQuestions = { ...usr };
      delete usrWithoutQuestions.questions;
      usersWithoutQuestions.push(usrWithoutQuestions);
      users.push(usr);
   }

   sendQuery(() => queryToCreateVerticesFromObjects(usersWithoutQuestions, 'user', 'userId').iterate());
   sendQuery(() => queryToSaveQuestionsResponsesForMultipleUsers(users).iterate());

   fakeUsersCreated.push(...users);

   return users;
}

function queryToSaveQuestionsResponsesForMultipleUsers(users: User[]): Traversal {
   const responsesForDB = users.map(u => {
      return {
         token: u.token,
         responses: u.questions.map(resp => ({
            ...resp,
            incompatibleAnswersJson: `[${getIncompatibleAnswers(resp.questionId, resp.answerId) || ''}]`,
         })),
      };
   });

   return g
      .inject(responsesForDB)
      .unfold()
      .map(
         __.as('data')
            // Search for the target user
            .select('token')
            .as('token')
            .select('data')
            .V()
            .hasLabel('user')
            .has('token', __.where(P.eq('token')))
            .as('user')
            .sideEffect(
               __.select('data')
                  .select('responses')
                  .unfold()
                  .map(
                     __.as('responseData')
                        .select('questionId')
                        .as('questionId')
                        // Get question vertex
                        .V()
                        .hasLabel('question')
                        .has('questionId', __.where(P.eq('questionId')))
                        .as('question')
                        // Remove edge pointing to question if necessary
                        .sideEffect(__.inE('response').where(__.outV().as('user')).drop())
                        .select('responseData')
                        // Add edge with the response
                        .addE('response')
                        .from_('user')
                        .to('question')
                        .property('questionId', __.select('questionId'))
                        .property('answerId', __.select('answerId'))
                        .property('useAsFilter', __.select('useAsFilter'))
                        .property('incompatibleAnswers', __.select('incompatibleAnswersJson')),
                  ),
            ),
      );
}
