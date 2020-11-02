import { sendQuery } from '../../../common-tools/database-tools/database-manager';
import { Traversal, GremlinValueType } from '../../../common-tools/database-tools/gremlin-typing-tools';
import { removePrivacySensitiveUserProps } from '../../../common-tools/security-tools/security-tools';
import { User } from '../../../shared-tools/endpoints-interfaces/user';
import { fromGremlinMapToUser } from '../../user/tools/data-conversion';

export async function fromQueryToCardsResult(traversal: Traversal): Promise<CardsGameResult> {
   const queryMap = (await sendQuery(() => traversal.next())).value as Map<
      keyof CardsGameResult,
      Array<Map<keyof User, GremlinValueType>>
   >;

   return {
      liking: queryMap
         .get('liking')
         .map(userFromQuery => removePrivacySensitiveUserProps(fromGremlinMapToUser(userFromQuery))),
      others: queryMap
         .get('others')
         .map(userFromQuery => removePrivacySensitiveUserProps(fromGremlinMapToUser(userFromQuery))),
   };
}

export interface CardsGameResult {
   liking: User[];
   others: User[];
}
