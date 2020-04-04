import * as Koa from 'koa';
import { queryToUserList } from '../../common-tools/database-tools/data-convertion-tools';
import { TokenParameter } from '../../shared-tools/endpoints-interfaces/common';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { retreiveCompleteUser } from '../common/models';
import { getDislikedUsers, getRecommendations } from './queries';

export async function recommendationsGet(params: TokenParameter, ctx: Koa.BaseContext): Promise<User[]> {
   const user: User = await retreiveCompleteUser(params.token, ctx);
   const recommendationsQuery = getRecommendations(user);
   return queryToUserList(recommendationsQuery);
}

export async function dislikedUsersGet(params: TokenParameter, ctx: Koa.BaseContext): Promise<User[]> {
   const user: User = await retreiveCompleteUser(params.token, ctx);
   const recommendationsQuery = getDislikedUsers(params.token, user);
   return queryToUserList(recommendationsQuery);
}
