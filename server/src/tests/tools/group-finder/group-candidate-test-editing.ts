import {
   getUsersFromGroupCandidateAsIndexList,
   getUserByIdOnGroupCandidate,
   AddUsersRandomlyParams,
   connectUsers,
   copyGroupCandidate,
} from "../../../components/groups-finder/tools/group-candidate-editing";
import { GroupCandidate } from "../../../components/groups-finder/tools/types";
import { chance } from "../generalTools";
import { generateId } from "../../../common-tools/string-tools/string-tools";
import { UserWithMatches } from "../../../shared-tools/endpoints-interfaces/groups";

/**
 * Creates a group candidate.
 * @param amountOfInitialUsers Unconnected users to create as the initial users
 * @param connectAllWithAll Connect all users with all
 */
export function createGroupCandidate(props: {
   amountOfInitialUsers: number;
   connectAllWithAll: boolean;
   customId?: string;
}): GroupCandidate {
   let resultGroup: GroupCandidate = {
      groupId: props.customId != null ? props.customId : generateId(),
      users: [],
   };
   for (let i = 0; i < props.amountOfInitialUsers; i++) {
      resultGroup = createAndAddOneUser({
         group: resultGroup,
         connectWith: props.connectAllWithAll ? "all" : [],
      });
   }
   return resultGroup;
}

export function createGroupCandidateWithCustomIds(props: {
   usersIds: string[];
   connectAllWithAll: boolean;
}): GroupCandidate {
   let resultGroup: GroupCandidate = {
      groupId: generateId(),
      users: [],
   };

   props.usersIds.forEach(
      userId =>
         (resultGroup = createAndAddOneUser({
            group: resultGroup,
            connectWith: props.connectAllWithAll ? "all" : [],
            userId,
         })),
   );

   return resultGroup;
}

export function addUsersToGroupWithCustomIds(props: {
   group: GroupCandidate;
   usersIds: string[];
   connectWith: "all" | number[];
}): GroupCandidate {
   let resultGroup: GroupCandidate = copyGroupCandidate(props.group);

   props.usersIds.forEach(
      userId =>
         (resultGroup = createAndAddOneUser({
            group: resultGroup,
            connectWith: props.connectWith,
            userId,
         })),
   );

   return resultGroup;
}

/**
 * Creates a group candidate fake user. Also adds the user to the group and connects other users according to the provided connections array.
 * Returns a copy of the group containing with the changes.
 * @param connectWith List of users from the provided group to connect with as a list of indexes to find them in the group candidate (not the userId). If null it will connect the fake users will all current users in the group, pass [] to do not connect the new fake users.
 */
export function createAndAddOneUser(props: {
   group: GroupCandidate;
   connectWith: number[] | "all";
   userId?: string;
}): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(props.group);
   const connectWith =
      props.connectWith === "all" ? getUsersFromGroupCandidateAsIndexList(resultGroup) : props.connectWith;

   const newUser: UserWithMatches = {
      userId: props.userId ?? generateId(),
      matches: connectWith.map(i => resultGroup.users[i].userId),
   };

   newUser.matches.forEach(userMatch =>
      getUserByIdOnGroupCandidate(resultGroup, userMatch).matches.push(newUser.userId),
   );
   resultGroup.users.push(newUser);
   return resultGroup;
}

/**
 * Creates multiple fake users and adds them to a group candidate.
 * All will have the same provided connections.
 * Only to be used on testing.
 *
 * @param amountOfUsers Amount of users to add
 * @param connectWith List of users from the provided group to connect with as a list of indexes to find them in the group (this doesn't work with the userId). If null it will connect the fake users will all current users in the group, pass [] to do not connect the new fake users.
 */
export function createAndAddMultipleUsers(
   group: GroupCandidate,
   amountOfUsers: number,
   connectWith: number[] | "all",
): GroupCandidate {
   let resultGroup: GroupCandidate = copyGroupCandidate(group);
   connectWith = connectWith ?? getUsersFromGroupCandidateAsIndexList(resultGroup);
   for (let i = 0; i < amountOfUsers; i++) {
      resultGroup = createAndAddOneUser({ group: resultGroup, connectWith });
   }
   return resultGroup;
}

/**
 * Creates fake users and adds them to the group, then connects them randomly with the previous members of the group.
 */
export function createAndAddMultipleUsersRandomlyConnected(params: AddUsersRandomlyParams): GroupCandidate {
   let resultGroup: GroupCandidate =
      params.group != null
         ? copyGroupCandidate(params.group)
         : createGroupCandidate({ amountOfInitialUsers: 0, connectAllWithAll: false });

   for (let i = 0; i < params.amountOfUsers; i++) {
      const connectWith: number[] = getRandomArrayIndexes(
         resultGroup.users.length,
         chance.integer({ min: params.minConnectionsPerUser, max: params.maxConnectionsPerUser }),
      );
      resultGroup = createAndAddOneUser({ group: resultGroup, connectWith });
   }
   return resultGroup;
}

export function connectSingleMemberWithAll(
   groupOfTheUser: GroupCandidate,
   user: UserWithMatches,
): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(groupOfTheUser);
   const userFromResultGroup: UserWithMatches = getUserByIdOnGroupCandidate(resultGroup, user.userId);
   resultGroup.users.forEach(u => {
      connectUsers(userFromResultGroup, u);
   });
   return resultGroup;
}

export function connectMembersAllWithAll(group: GroupCandidate): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   resultGroup.users.forEach(user => {
      resultGroup.users.forEach(userToConnect => {
         connectUsers(user, userToConnect);
      });
   });
   return resultGroup;
}

export function connectMembersRandomly(
   group: GroupCandidate,
   minConnectionsPerUser: number,
   maxConnectionsPerUser: number,
): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);

   resultGroup.users.forEach((user, i) => {
      const randomIndexes: number[] = getRandomArrayIndexes(
         resultGroup.users.length,
         chance.integer({ min: minConnectionsPerUser, max: maxConnectionsPerUser }),
         // Exclude it's own index so it does not get connected with itself
         i,
      );
      randomIndexes.forEach(randomIndex => {
         connectUsers(user, resultGroup.users[randomIndex]);
      });
   });
   return resultGroup;
}

/**
 * Example: Connects 2 with 1 and 3, and so on...
 * @param loop Connect the last one with the first one generating a "circle"
 */
export function connectMembersWithNeighbors(group: GroupCandidate, loop: boolean = false): GroupCandidate {
   const resultGroup: GroupCandidate = copyGroupCandidate(group);
   resultGroup.users.forEach((user, i) => {
      if (i - 1 >= 0) {
         connectUsers(user, resultGroup.users[i - 1]);
      } else if (loop) {
         connectUsers(user, resultGroup.users[resultGroup.users.length - 1]);
      }
      if (i + 1 < resultGroup.users.length) {
         connectUsers(user, resultGroup.users[i + 1]);
      } else if (loop) {
         connectUsers(user, resultGroup.users[0]);
      }
   });
   return resultGroup;
}

function getRandomArrayIndexes(arrayLength: number, amount: number, exclude: number = null): number[] {
   let result: number[] = [];
   for (let i = 0; i < arrayLength; i++) {
      if (i !== exclude) {
         result.push(i);
      }
   }

   result = chance.shuffle(result);
   result = result.slice(0, amount);

   return result;
}
