import { GROUP_SLOTS_CONFIGS } from '../../configurations';
import { queryToGetGroupCandidates, queryToGetGroupsReceivingNewUsers } from './queries';
import { fromQueryToGroupCandidates, fromQueryToGroupsReceivingNewUsers } from './tools/data-conversion';
import { groupOrderingTest } from './tools/group-candidate-test';

// TODO: Tal vez convendria implementar un tiempo de espera para ocupar un slot propio de la configuracion del slot
// Para eso Le puedo poner un timestamp al edge del slot y que no lo libere hasta que no pase cierto tiempo.
// de lo contrario el primer grupo siempre va a ser uno chico. Aunque si es la primera vez en la app si deberia al menos
// apurarse con un grupo y que sea chico, pero ya si es el segundo puede esperar un poco

groupOrderingTest();

// TODO: Implement
async function searchAndCreateNewGoodQualityGroups(): Promise<void> {
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await fromQueryToGroupCandidates(queryToGetGroupCandidates(i, GroupQuality.Good));
   }
}

// TODO: Implement
async function searchAndAddUsersToExistingGroups(): Promise<void> {
   for (let i = GROUP_SLOTS_CONFIGS.length - 1; i >= 0; i--) {
      await fromQueryToGroupsReceivingNewUsers(queryToGetGroupsReceivingNewUsers(i));
   }
}

export interface GroupsReceivingNewUsers {
   groupId: string;
   usersToAdd: Array<{ userId: string; matchesAmount: number }>;
   groupMatches: UserWithMatches[];
}

export interface UserWithMatches {
   userId: string;
   matches: string[];
}

export type GroupCandidate = UserWithMatches[];

export interface SizeRestriction {
   minimumSize?: number;
   maximumSize?: number;
}

export interface GroupSlotConfig extends SizeRestriction {
   amount: number;
}

export enum GroupQuality {
   Bad,
   Good,
}
