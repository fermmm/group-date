/**
 * This version of createFakeUsers creates many users on the same database request but seems to
 * be a limit in the amount of data per request, if this limit is passed the request never responds.
 * The solution is to call many requests of 40 users each. Performance and it's not much better than
 * one request per user but it seems to be multithreading safe.
 */

import { queryToCreateVerticesFromObjects } from "../../common-tools/database-tools/common-queries";
import { __, sendQuery } from "../../common-tools/database-tools/database-manager";
import { numberChunksCallback } from "../../common-tools/js-tools/js-tools";
import { User } from "../../shared-tools/endpoints-interfaces/user";
import { generateRandomUserProps } from "./users";

let fakeUsersCreated: User[] = [];

export async function createFakeUsers2(
   amount: number,
   customParams?: Partial<User>,
   useMultithreading: boolean = false,
): Promise<User[]> {
   const usersCreated: User[] = [];

   numberChunksCallback(amount, 40, async amountForRequest => {
      usersCreated.push(
         ...(await generateAndCreateFakeUsers(amountForRequest, customParams, useMultithreading)),
      );
   });

   return usersCreated;
}

export async function createFakeUser2(
   customParams?: Partial<User>,
   useMultithreading: boolean = false,
): Promise<User> {
   return (await generateAndCreateFakeUsers(1, customParams, useMultithreading))[0];
}

async function generateAndCreateFakeUsers(
   amount: number,
   customParams?: Partial<User>,
   useMultithreading: boolean = false,
): Promise<User[]> {
   const users: User[] = [];
   const finalParams = { ...(customParams ?? {}) };

   if (amount > 1) {
      // userId, token and email should be null here otherwise instead of creating each user it will replace the first one
      delete finalParams?.userId;
      delete finalParams?.token;
      delete finalParams?.email;
   }

   for (let i = 0; i < amount; i++) {
      users.push(generateRandomUserProps(finalParams));
   }

   await sendQuery(() =>
      queryToCreateVerticesFromObjects({
         objects: users,
         label: "user",
         duplicationAvoidanceProperty: !useMultithreading ? "userId" : null, // Checking for duplication is not supported in multithreading
      }).iterate(),
   );

   fakeUsersCreated.push(...users);

   return users;
}

export function getAllTestUsersCreatedExperimental(): User[] {
   const result = [...fakeUsersCreated];
   fakeUsersCreated = [];
   return result;
}
