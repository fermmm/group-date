import * as Koa from 'koa';
import { asUser } from '../../common-tools/database-tools/data-convertion-tools';
import { UserFromDatabase } from '../../common-tools/database-tools/gremlin-typing-tools';
import { removePrivacySensitiveUserProps } from '../../common-tools/security-tools/security-tools';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { retreiveCompleteUser } from '../common/models';
import { getRecommendations } from './queries';

export async function recommendationsGet(params: TokenParameter, ctx: Koa.BaseContext): Promise<User[]> {
   const user: User = await retreiveCompleteUser(params.token, ctx);
   const queryResult = await getRecommendations(user);
   return queryResult.map(userFromQuery => removePrivacySensitiveUserProps(asUser(userFromQuery as UserFromDatabase)));
}
