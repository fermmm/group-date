import * as moment from 'moment';
import { MarkRequired } from 'ts-essentials';
import { v1 as uuidv1 } from 'uuid';
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, column, g, P } from '../../common-tools/database-tools/database-manager';
import { Traversal } from '../../common-tools/database-tools/gremlin-typing-tools';
import { DayOption, Group, GroupChat } from '../../shared-tools/endpoints-interfaces/groups';
import { queryToGetUserById } from '../common/queries';

/**
 * Creates a group and returns it as a traversal query
 */
/**
 * TODO:
 *    - [Hecho] La funcion de crear grupo tiene que aceptar usuarios iniciales para agregar
 *
 *    - [Hecho] Cuando se crea un grupo se crea un edge desde cada usuario al grupo llamado slot1 o slot2
 *      segun corresponda con la cantidad de usuarios iniciales
 *
 *    - [Hecho] Cuando se crea un grupo cambiar los edges Match entre sus usuarios por "SeenMatch"
 *
 *    - [Hecho] La funcion que agrega un voto a la dateIdea hay que programarla de vuelta basada en la property dateIdeaVotes
 *      de el edge "member"
 *
 *    - [Hecho] Hay que programar de vuelta para que devuelva los votos de todas las dates ideas
 *      ahora mismo no esta devolviendo quienes votaron
 *
 *    - Actualmente no hay un test de los slots, habría que implementarlo.
 *
 *    - Arreglar el juego de cartas para que no aparezcan los Match ni los SeenMatch
 *
 *    - Antes de agregar usuarios a un grupo ya existente tiene que haber algo que impide que el grupo sea
 *      mas grande que el maximo
 *
 *    - Cuando un grupo esta finalizado se elimina el edge slot1 o slot2
 *
 *    Problema: Si cambio "Match" por "SeenMatch" al crear el grupo, entonces como entran nuevos usuarios con el
 *    grupo ya creado si no se vuelve a computar, lo que se podria hacer es crear una nueva busqueda pero para
 *    meter usuarios nuevos en grupos ya creados
 */
export function queryToCreateGroup(dayOptions: DayOption[], initialUsers?: AddUsersToGroupSettings): Traversal {
   let traversal: Traversal = g
      .addV('group')
      .property('groupId', uuidv1())
      .property(
         'chat',
         serializeIfNeeded<GroupChat>({
            usersDownloadedLastMessage: [],
            messages: [],
         }),
      )
      .property('creationDate', moment().unix())
      .property('dayOptions', serializeIfNeeded(dayOptions))
      .property('usersThatAccepted', serializeIfNeeded([]))
      .property('feedback', serializeIfNeeded([]));

   if (initialUsers != null) {
      traversal = queryToAddUsersToGroup(traversal, initialUsers);
   }

   return traversal;
}

/**
 * Receives a traversal that selects a group and adds users to the group, also returns the group vertex.
 * Also changes the "Match" edges between the members for new "SeenMatch" edges to be ignored by the group
 * finding algorithms avoiding repeated groups or groups with repeated matches.
 *
 * @param group The traversal that returns a group vertex.
 * @param usersIds The list of user ids to add to the group.
 * @param slotToUse The id of the slot that will be used on the users being added to the group. You can use getSlotIdFromUsersAmount() to get this value
 */
export function queryToAddUsersToGroup(group: Traversal, settings: AddUsersToGroupSettings): Traversal {
   return (
      group
         .as('group')
         .sideEffect(
            __.V()
               // Make queries selecting each user by the user id provided and add the member edge to the group
               .union(...settings.usersIds.map(u => __.has('userId', u)))
               .sideEffect(__.addE('member').to('group'))
               // Add the corresponding slot edge, slots avoids adding the users in too many groups
               .sideEffect(__.addE('slot' + settings.slotToUse).to('group')),
         )

         // Change the "Match" edges between the members for new "SeenMatch" edges in order to be ignored by the group
         // finding algorithms avoiding repeated groups or groups with repeated matches.
         .sideEffect(
            __.both('member')
               .bothE('Match')
               .where(
                  __.bothV()
                     .simplePath()
                     .both('member')
                     .where(P.eq('group')),
               )
               .dedup()
               .sideEffect(
                  __.addE('SeenMatch')
                     .from_(__.inV())
                     .to(__.outV()),
               )
               .drop(),
         )
   );
}

export function queryToVoteDateIdeas(group: Traversal, userId: string, usersIdsToVote: string[]): Traversal {
   let traversal: Traversal = group
      .as('group')
      .V()
      .has('userId', userId)
      .as('user')
      .sideEffect(
         __.outE('dateIdeaVote')
            .where(__.inV().as('group'))
            .drop(),
      );

   usersIdsToVote.forEach(
      ideaUserId =>
         (traversal = traversal.sideEffect(
            __.addE('dateIdeaVote')
               .to('group')
               .property('ideaOfUser', ideaUserId),
         )),
   );

   traversal = traversal.select('group');

   return traversal;
}

export function queryToGetGroupById(groupId: string, onlyIfAMemberHasUserId?: string): Traversal {
   let traversal = g.V().has('group', 'groupId', groupId);

   if (onlyIfAMemberHasUserId != null) {
      traversal = traversal.where(__.in_('member').has('userId', onlyIfAMemberHasUserId));
   }

   return traversal;
}

export function queryToGetGroupsOfUserByUserId(userId: string): Traversal {
   return queryToGetUserById(userId).out('member');
}

export function queryToUpdateGroupProperty(
   group: MarkRequired<Partial<Group>, 'groupId'>,
   onlyIfAMemberHasUserId?: string,
): Promise<void> {
   let traversal = queryToGetGroupById(group.groupId, onlyIfAMemberHasUserId);

   for (const key of Object.keys(group)) {
      traversal = traversal.property(key, serializeIfNeeded(group[key]));
   }

   return traversal.iterate();
}

/**
 * Receives a traversal that selects one or more groups vertices, returns the groups including the members list.
 * @param traversal A traversal that has one or more groups.
 * @param details The list of group details to include default = all details
 */
export function queryToGetGroupsInFinalFormat(
   traversal: Traversal,
   includeFullDetails: boolean = true,
): Traversal {
   let detailsTraversals: Traversal[] = [];

   if (includeFullDetails) {
      detailsTraversals = [
         // Add the details about the members of the group
         __.project('members').by(
            __.in_('member')
               .valueMap()
               .by(__.unfold())
               .fold(),
         ),
         // Add the details about the usersIds that received a vote to their date idea and who voted
         __.project('dateIdeasVotes').by(
            __.inE('dateIdeaVote')
               .group()
               .by('ideaOfUser')
               .by(
                  __.outV()
                     .values('userId')
                     .fold(),
               ),
         ),
      ];
   }

   traversal = traversal.map(
      __.union(__.valueMap().by(__.unfold()), ...detailsTraversals)
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );

   return traversal;
}

export interface AddUsersToGroupSettings {
   usersIds: string[];
   slotToUse: number;
}
