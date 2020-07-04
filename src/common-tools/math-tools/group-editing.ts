/**
 * Creates a group as a list of user's connections
 * @param initialUsers Empty users to add as the initial users
 */
export function createGroup(initialUsers: number): number[][] {
   const result: number[][] = [];
   for (let i = 0; i < initialUsers; i++) {
      result.push([]);
   }
   return result;
}

/**
 * Adds a user to a group. Returns the changes as a copy.
 * @param groupAsConnections The group as a list of each user's connections
 * @param userConnections The user as a group of connections
 */
export function addUser(groupAsConnections: number[][], userConnections: number[] = []): number[][] {
   const result = groupAsConnections.map(u => [...u]);
   const newUserIndexPos: number = result.push(userConnections) - 1;
   userConnections.forEach(connectedUser => result[connectedUser].push(newUserIndexPos));
   return result;
}

/**
 * Adds many users with the same connections.
 * @param amount Amount of users to add
 */
export function addUsers(
   groupAsConnections: number[][],
   amount: number,
   userConnections: number[] = [],
): number[][] {
   let result = groupAsConnections.map(u => [...u]);
   for (let i = 0; i < amount; i++) {
      result = addUser(result, userConnections);
   }
   return result;
}

/**
 * In a group as connections removes the exceeding connections of a user when there are more than the
 * maximum specified.
 */
export function removeExceedingConnections(
   groupAsConnections: number[][],
   maxConnectionsAllowed: number,
): number[][] {
   const groupCopy: number[][] = groupAsConnections.map(item => [...item]);
   groupCopy.forEach((userConnections, userIndex) => {
      if (userConnections.length > maxConnectionsAllowed) {
         for (let i = userConnections.length - 1; i >= maxConnectionsAllowed; i--) {
            const otherEndUserConnections: number[] = groupCopy[userConnections[i]];
            otherEndUserConnections.splice(otherEndUserConnections.indexOf(userIndex), 1);
            userConnections.splice(i, 1);
         }
      }
   });

   return groupCopy;
}
