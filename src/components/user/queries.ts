import { process } from 'gremlin';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, retryOnError } from '../../common-tools/database-tools/database-manager';
import {
   allAttractionTypes,
   AttractionType,
   SetAttractionParams,
} from '../../shared-tools/endpoints-interfaces/user';
import { editableUserPropsList, ExposedUserProps } from '../../shared-tools/validators/user';
import { getUserTraversalByToken, hasProfileCompleted } from '../common/queries';

export function queryToCreateUser(
   token: string,
   email: string,
   setProfileCompletedForTesting = false,
): process.GraphTraversal {
   return getUserTraversalByToken(token)
      .fold()
      .coalesce(
         __.unfold(),
         __.addV('user')
            .property('token', token)
            .property('userId', uuidv1())
            .property('email', email)
            .property('profileCompleted', setProfileCompletedForTesting)
            .property('sendNewUsersNotification', 0)
            .property('notifications', '[]'),
      );
}

export async function setUserEditableProps(token: string, userProps: ExposedUserProps): Promise<void> {
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

   for (const paramsItem of params.attractions) {
      const involvedUsersSearch = __.V()
         .has('user', 'userId', paramsItem.userId)
         .where(__.not(__.has('user', 'token', params.token))) // This prevents self liking
         .store(paramsItem.userId);

      let traversal: process.GraphTraversal = __.select(paramsItem.userId).unfold();

      // Removes all edges pointing to the target user that are labeled as any attraction type
      traversal = traversal.sideEffect(
         __.inE(...allAttractionTypes)
            .where(__.outV().as('user'))
            .drop(),
      );

      // If there is a "Match" edge replace it with a "Like" from the target user
      traversal = traversal.choose(
         __.bothE('Match')
            .where(__.bothV().as('user'))
            .store('e'),
         __.sideEffect(
            __.select('e')
               .unfold()
               .drop(),
         ).sideEffect(__.addE(AttractionType.Like).to('user')),
      );

      // Now that we removed all the information pointing to the target user we can add the new one
      if (paramsItem.attractionType === AttractionType.Like) {
         // If we are going to save a like and the target user also likes the user we remove
         // the target user's like and replace it by a Match. The direction of the match edge
         // points to the user that sent the first of the two required likes to form the match.
         traversal = traversal.choose(
            __.outE(AttractionType.Like)
               .where(__.inV().as('user'))
               .store('x'),
            __.sideEffect(
               __.select('x')
                  .unfold()
                  .drop(),
            )
               .addE('Match')
               .from_('user'),
            // If the target user does not have a like on the user then there is no match, so
            // we only need to add the Like edge and we are done
            __.addE(paramsItem.attractionType).from_('user'),
         );
      } else {
         // If the user are not adding a Like then there is no match, so we only need to add the
         // attraction edge and we are done
         traversal = traversal.addE(paramsItem.attractionType).from_('user');
      }

      // If the involved users search returns a result perform the action, otherwise it will continue without changes
      query = query.choose(involvedUsersSearch, traversal);
   }

   return retryOnError(() => query.iterate());
}
