import * as Router from '@koa/router';
import {
   callGroupCreationMultipleTimes,
   createFullUsersFromGroupCandidate,
   retrieveFinalGroupsOf,
} from '../../tests/tools/group-finder/user-creation-tools';
import { queryToRemoveUsers } from '../user/queries';
import {
   connectMembersWithNeighbors,
   createAndAddOneUser,
   createGroupCandidate,
   createAndAddMultipleUsers,
} from '../../tests/tools/group-finder/group-candidate-test-editing';
import { logGroupsTest } from '../../tests/tools/group-finder/group-candidates-ordering';
import { createFakeUser, createFakeUsersFast } from '../../tests/tools/users';
import { QuestionResponseParams, User } from '../../shared-tools/endpoints-interfaces/user';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { getIncompatibleAnswersRecord, getIncompatibleAnswers } from '../user/questions/models';
import { g, P, __ } from '../../common-tools/database-tools/database-manager';
import { valueMap } from '../../common-tools/database-tools/common-queries';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      // const fakeUsers = await createFakeUsers(3);
      // const mainUser = fakeUsers[0];

      console.log(await g.V().hasLabel('user').toList());
      const user: User = await createFakeUsersFast(1)[0];

      console.log(
         await queryToRespondQuestions([
            {
               token: user.token,
               responses: [
                  {
                     questionId: 0,
                     answerId: 0,
                     useAsFilter: true,
                  },
               ],
            },
         ]).toList(),
      );

      ctx.body = `Finished OK`;
   });
}

export function queryToRespondQuestions(responses: MultipleUsersQuestionsResponses[]): Traversal {
   const incompatibleAnswers = getIncompatibleAnswersRecord();

   return g
      .inject([{ incompatibleAnswers, responses }])
      .unfold()
      .sideEffect(__.select('incompatibleAnswers').store('incompatibleAnswers'))
      .select('responses')
      .unfold()
      .map(
         // Only the combination of select().as().select() works here:
         __.select('token')
            .as('token')
            // has() doesn't work here but hasLabel() + has() works:
            .V()
            .hasLabel('user')
            .has('token', __.select('token'))
            // Remove edge if already exists:
            .sideEffect()
            .select('responses'),
      );
}

export interface MultipleUsersQuestionsResponses {
   token: string;
   responses: QuestionResponseParams[];
}
