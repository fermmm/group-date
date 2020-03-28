import { process } from 'gremlin';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
import { __, retryOnError } from '../../common-tools/database-tools/database-manager';
import { AttractionType, SetAttractionParams } from '../../shared-tools/endpoints-interfaces/user';
import { editableUserPropsList, ExposedUserProps } from '../../shared-tools/validators/user';
import { getUserTraversalByToken, hasProfileCompleted } from '../common/queries';

export async function setUserProps(token: string, userProps: ExposedUserProps): Promise<void> {
   let query: process.GraphTraversal = getUserTraversalByToken(token);

   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] != null) {
         query = query.property(editableUserProp, serializeIfNeeded(userProps[editableUserProp]));
      }
   });

   return retryOnError(() => query.iterate());
}

const allAtractionTypes: AttractionType[] = Object.values(AttractionType);

export async function setAttraction(params: SetAttractionParams): Promise<void> {
   let query: process.GraphTraversal = hasProfileCompleted(getUserTraversalByToken(params.token)).as('user');

   for (const attraction of params.attractions) {
      // Selects target user
      const search = __.V()
         .has('user', 'email', attraction.userEmail)
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
