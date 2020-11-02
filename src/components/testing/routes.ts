import * as Router from '@koa/router';
import { createFakeCompatibleUsers, createFakeUser } from '../../tests/tools/users';
import { setAttractionPost } from '../user/models';
import { queryToRemoveUsers } from '../user/queries';
import { AttractionType, User } from '../../shared-tools/endpoints-interfaces/user';
import { recommendationsGet } from '../cards-game/models';
import { queryToDivideLikingUsers, queryToGetCardsRecommendations } from '../cards-game/queries';
import { fromGremlinMapToUser, fromQueryToUserList } from '../user/tools/data-conversion';
import { GremlinValueType, Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { valueMap } from '../../common-tools/database-tools/common-queries';
import { sendQuery } from '../../common-tools/database-tools/database-manager';
import { removePrivacySensitiveUserProps } from '../../common-tools/security-tools/security-tools';
import { fromQueryToCardsResult, CardsGameResult } from '../cards-game/tools/data-conversion';
import { divideArrayCallback, shuffleArray } from '../../common-tools/js-tools/js-tools';
import {
   LIKING_USERS_CHUNK,
   NON_LIKING_USERS_CHUNK,
   SHUFFLE_LIKING_NON_LIKING_RESULTS,
} from '../../configurations';

export function testingRoutes(router: Router): void {
   router.get('/testing', async ctx => {
      await queryToRemoveUsers();
      const testUser = await createFakeUser();
      const compatibles = await createFakeCompatibleUsers(testUser, 3);
      await setAttractionPost(
         {
            token: compatibles[0].token,
            attractions: [{ userId: testUser.userId, attractionType: AttractionType.Like }],
         },
         ctx,
      );
   });

   router.get('/testing2', async ctx => {
      ctx.body = `Finished OK`;
   });
}
