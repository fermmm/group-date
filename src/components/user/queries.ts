import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, P, retryOnError } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import {
   allAttractionTypes,
   allMatchTypes,
   AttractionType,
   SetAttractionParams,
} from '../../shared-tools/endpoints-interfaces/user';
import { editableUserPropsList, ExposedUserProps } from '../../shared-tools/validators/user';
import { hasProfileCompleted, queryToGetUserByToken } from '../common/queries';

export function queryToCreateUser(
   token: string,
   email: string,
   setProfileCompletedForTesting = false,
): Traversal {
   return queryToGetUserByToken(token)
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

export async function queryToSetUserEditableProps(token: string, userProps: ExposedUserProps): Promise<void> {
   let query: Traversal = queryToGetUserByToken(token);

   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] != null) {
         query = query.property(editableUserProp, serializeIfNeeded(userProps[editableUserProp]));
      }
   });

   return retryOnError(() => query.iterate());
}

/**
 * To play with this query: https://gremlify.com/chrl4ahk3t
 */
export function queryToSetAttraction(params: SetAttractionParams): Traversal {
   const usersToSetAttractionTraversals: Traversal[] = params.attractions.map(p =>
      __.has('user', 'userId', p.userId),
   );
   const isUserToLikeCheckTraversals: Traversal[] = params.attractions.flatMap(p =>
      p.attractionType === AttractionType.Like ? __.values('userId').is(P.eq(p.userId)) : [],
   );

   return (
      hasProfileCompleted(queryToGetUserByToken(params.token))
         .as('user')
         .V()
         .union(...usersToSetAttractionTraversals)

         // This prevents self like
         .not(__.has('token', params.token))

         // On seen matches is not possible to edit the attraction anymore
         .not(__.both('SeenMatch').where(P.eq('user')))

         .map(
            __.as('target')

               // Removes all edges pointing to the target user that are labeled as any attraction type
               .sideEffect(
                  __.inE(...allAttractionTypes)
                     .where(__.outV().as('user'))
                     .drop(),
               )

               // Also remove the match edge because at this point we don't know if they are going to match
               .sideEffect(
                  __.bothE('Match')
                     .where(__.bothV().as('user'))
                     .drop(),
               )

               // Now we can add the new edges
               .sideEffect(
                  __.choose(
                     __.union(...isUserToLikeCheckTraversals),
                     __.addE('Like').from_('user'),
                     __.addE('Dislike').from_('user'),
                  ),
               )

               // If the users like each other add a Match edge
               .choose(
                  __.outE('Like')
                     .where(__.inV().as('user'))
                     .inV()
                     .outE('Like')
                     .where(__.inV().as('target')),
                  __.sideEffect(__.addE('Match').from_('user')),
               ),
         )
   );
}

export function queryToGetMatches(token: string): Traversal {
   return queryToGetUserByToken(token).both(...allMatchTypes);
}

export function queryToGetAttractionsSent(token: string, types?: AttractionType[]): Traversal {
   types = types ?? allAttractionTypes;
   return queryToGetUserByToken(token)
      .as('user')
      .out(...types)
      .where(__.not(__.both(...allMatchTypes).as('user')));
}

export function queryToGetAttractionsReceived(token: string, types?: AttractionType[]): Traversal {
   types = types ?? allAttractionTypes;
   return queryToGetUserByToken(token)
      .as('user')
      .in_(...types)
      .where(__.not(__.both(...allMatchTypes).as('user')));
}
