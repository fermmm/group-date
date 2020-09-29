/**
 * This version of createFakeUsers creates many users on the same database request but seems to
 * be a limit in the amount of data per request when using inject(), the solution is to call many
 * requests of 40 users each. I compared the performance and it's not much better than one request
 * per user so I save in this file the code and the queries I did for this approach, just in case
 * I need something from here in the future.
 */

import { serializeAllValuesIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, g, P } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { getIncompatibleAnswers } from '../../components/user/questions/models';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { generateRandomUserProps } from './users';
const fakeUsersCreated: User[] = [];

async function createFakeUsers(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const usersPerRequest: number = 40;
   const requestsAmount: number = Math.ceil(amount / usersPerRequest);
   const usersCreated: User[] = [];

   for (let i = 1; i < requestsAmount; i++) {
      if (i < requestsAmount) {
         // Create the maximum users per request
         usersCreated.push(...(await createMultipleFakeUsers(usersPerRequest, customParams)));
         continue;
      }
      // In the last request create the remaining users
      usersCreated.push(...(await createMultipleFakeUsers(amount - usersCreated.length, customParams)));
   }

   return usersCreated;
}

async function createFakeUser(customParams?: Partial<User>): Promise<User> {
   return (await createMultipleFakeUsers(1, customParams))[0];
}

async function createMultipleFakeUsers(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const users: User[] = [];
   const finalParams = { ...(customParams ?? {}) };

   if (amount > 1) {
      // userId, token and email should be null here otherwise instead of creating each user it will replace the first one
      delete finalParams?.userId;
      delete finalParams?.token;
      delete finalParams?.email;
   }

   for (let i = 0; i < amount; i++) {
      users.push(generateRandomUserProps(finalParams));
   }

   await queryToCreateMultipleUsers(users).iterate();
   await queryToSaveQuestionsResponsesForMultipleUsers(users).iterate();

   fakeUsersCreated.push(...users);

   return users;
}

function queryToCreateMultipleUsers(usersData: Array<Partial<User>>): Traversal {
   const userDataReadyForDB = usersData.map(userData => {
      const result = serializeAllValuesIfNeeded(userData);
      delete result.questions;
      return result;
   });

   let creationTraversal: Traversal = __.addV('user');
   Object.keys(userDataReadyForDB[0]).forEach(
      key => (creationTraversal = creationTraversal.property(key, __.select(key))),
   );

   return g
      .withSideEffect('nothing', [])
      .inject(userDataReadyForDB)
      .unfold()
      .map(
         __.as('userData')
            .select('token')
            .as('token')
            .select('userData')
            .choose(
               __.V()
                  .hasLabel('user')
                  .has('token', __.where(P.eq('token'))),
               __.select('nothing'),
               creationTraversal,
            ),
      )
      .unfold();
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
