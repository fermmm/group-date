import { process } from 'gremlin';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-convertion-tools';
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
         .fold();

      let traversal: process.GraphTraversal = __.unfold();

      // Removes all edges pointing to the target user that are labeled as any attraction type
      for (const attractionType of allAttractionTypes) {
         traversal = traversal.sideEffect(
            __.inE(attractionType)
               .where(__.outV().as('user'))
               .drop(),
         );
      }

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

      // We search again to get the changes done in the lines above
      traversal = traversal.V().has('user', 'userId', paramsItem.userId);

      if (paramsItem.attractionType === AttractionType.Like) {
         // If we are going to save a like and the target user also likes the user we remove
         // the like and replace it by a Match
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
            // we just need to add the Like edge
            // TODO: Esta linea esta tirando error
            __.addE(paramsItem.attractionType).from_('user'),
         );
      } else {
         // If the user are not adding a Like then there is no match, so just add the
         // attraction edge
         traversal = traversal.addE(paramsItem.attractionType).from_('user');
      }

      // If the involved users search returns a result perform the action, otherwise it will continue without changes
      query = query.choose(involvedUsersSearch, traversal);
   }

   return retryOnError(() => query.iterate());
}

/*export async function setAttraction(params: SetAttractionParams): Promise<void> {
   let query: process.GraphTraversal = hasProfileCompleted(getUserTraversalByToken(params.token)).as('user');

   for (const paramsItem of params.attractions) {
      let traversal: process.GraphTraversal;
      const onMatchTraversal = getOnMatchTraversal(paramsItem.userId);
      const onNotAMatchTraversal = getNotAMatchTraversal(paramsItem.userId, paramsItem.attractionType);

      if (paramsItem.attractionType === AttractionType.Like) {
         traversal = __.V()
            .has('user', 'userId', paramsItem.userId)
            .coalesce(
               __.bothE('Match').where(__.bothV().as('user')), // If there is a match don't do anything
               __.choose(
                  __.outE(AttractionType.Like).where(__.inV().as('user')), // If the tartget user likes the user do the onMatchTraversal
                  onMatchTraversal,
                  onNotAMatchTraversal,
               ),
            );
      } else {
         traversal = onNotAMatchTraversal;
      }

      const involvedUsersSearch = __.V()
         .has('user', 'userId', paramsItem.userId)
         .where(__.not(__.has('user', 'token', params.token))); // Prevents self liking

      // If the involved users search returns a result perform the action, otherwise it will continue
      query = query.choose(involvedUsersSearch, traversal);
   }

   return retryOnError(() => query.iterate());
}*/
/*
function getNotAMatchTraversal(targetUserId: string, attraction: AttractionType) {
   let result: process.GraphTraversal = __.V().has('user', 'userId', targetUserId);

   // Removes all edges pointing to the target user that are labeled as any attraction type
   for (const attractionType of allAttractionTypes) {
      result = result.sideEffect(
         __.inE(attractionType)
            .where(__.outV().as('user'))
            .drop(),
      );
   }

   // If there is a "Match" edge replace it with a "Like" from the target user
   result = result.choose(
      __.bothE('Match').where(__.bothV().as('user')),
      __.sideEffect(
         __.bothE('Match')
            .where(__.bothV().as('user'))
            .drop(),
      ).sideEffect(__.addE(AttractionType.Like).to('user')),
   );

   // Adds the attraction edge
   result = result.sideEffect(__.addE(attraction).from_('user'));

   return result;
}

function getOnMatchTraversal(targetUserId: string) {
   let result: process.GraphTraversal = __.V().has('user', 'userId', targetUserId);

   // Removes all edges between the users because they will be replaced by a single "Match" edge
   for (const attractionType of allAttractionTypes) {
      result = result.sideEffect(
         __.bothE(attractionType)
            .where(__.bothV().as('user'))
            .drop(),
      );
   }

   // Adds the "Match edge"
   result = result.addE('Match').from_('user');

   return result;
}
*/
