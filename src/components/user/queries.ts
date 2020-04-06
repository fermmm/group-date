import { process } from 'gremlin';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, retryOnError } from '../../common-tools/database-tools/database-manager';
import { allAtractionTypes, SetAttractionParams } from '../../shared-tools/endpoints-interfaces/user';
import { editableUserPropsList, ExposedUserProps } from '../../shared-tools/validators/user';
import { getUserTraversalByToken, hasProfileCompleted } from '../common/queries';

export function queryToCreateUser(token: string, email: string): process.GraphTraversal {
   return getUserTraversalByToken(token)
      .fold()
      .coalesce(
         __.unfold(),
         __.addV('user')
            .property('email', email)
            .property('token', token)
            .property('userId', uuidv1())
            .property('profileCompleted', false),
      );
}

export async function setUserProps(token: string, userProps: ExposedUserProps): Promise<void> {
   let query: process.GraphTraversal = getUserTraversalByToken(token);

   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] != null) {
         query = query.property(editableUserProp, serializeIfNeeded(userProps[editableUserProp]));
      }
   });

   return retryOnError(() => query.iterate());
}

export async function setAttraction(params: SetAttractionParams): Promise<void> {
   let query: process.GraphTraversal = hasProfileCompleted(getUserTraversalByToken(params.token)).as('user');

   for (const attraction of params.attractions) {
      // Selects target user
      const search = __.V()
         .has('user', 'userId', attraction.userId)
         .where(__.not(__.has('user', 'token', params.token))); // Prevents self liking

      let action: process.GraphTraversal = search;
      // Removes all edges pointing to the target user that are labeled as any attraction type
      for (const attractionType of allAtractionTypes) {
         action = action.sideEffect(
            __.inE(attractionType)
               .where(__.outV().as('user'))
               .drop(),
         );
      }

      // Adds the attraction edge
      action = action.addE(attraction.attractionType).from_('user');

      // If the search returned a result perform the action, otherwise it will continue
      query = query.choose(search, action);
   }

   return retryOnError(() => query.iterate());
}
