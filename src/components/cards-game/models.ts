import { BaseContext } from 'koa';
import { queryToUserList } from '../../common-tools/database-tools/data-convertion-tools';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { retrieveFullyRegisteredUser } from '../common/models';
import { getDislikedUsers, getRecommendations } from './queries';

export async function recommendationsGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery = getRecommendations(user);
   return queryToUserList(recommendationsQuery);
}

export async function dislikedUsersGet(params: TokenParameter, ctx: BaseContext): Promise<User[]> {
   const user: User = await retrieveFullyRegisteredUser(params.token, true, ctx);
   const recommendationsQuery = getDislikedUsers(params.token, user);
   return queryToUserList(recommendationsQuery);
}
