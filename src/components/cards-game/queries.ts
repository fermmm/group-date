import { process } from 'gremlin';
import { __, g, retryOnError } from '../../common-tools/database-tools/database-manager';
import { User } from '../../shared-tools/endpoints-interfaces/user';
import { addQuestionsResponded, getUserTraversalByToken } from '../common/queries';

export async function getRecommendations(user: User): Promise<process.Traverser[]> {
   let query: process.GraphTraversal = getUserTraversalByToken(user.token).as('user');

   query = query.V().has('user', 'gender', 'Woman');

   return await retryOnError(() => addQuestionsResponded(query).toList());
}
