import { Notification } from "./../../shared-tools/endpoints-interfaces/user";
import { serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { __, P, sendQuery, g, column } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import {
   allAttractionTypes,
   allMatchTypes,
   AttractionType,
   SetAttractionParams,
   User,
} from "../../shared-tools/endpoints-interfaces/user";
import { EditableUserProps, editableUserPropsList } from "../../shared-tools/validators/user";
import * as moment from "moment";
import { ValueOf } from "ts-essentials";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { time } from "../../common-tools/js-tools/js-tools";
import { TokenOrId } from "./tools/typings";
import { checkTypeByMember } from "../../common-tools/ts-tools/ts-tools";
import { DEFAULT_LANGUAGE } from "../../configurations";

export function queryToCreateUser(
   token: string,
   email: string,
   welcomeNotification: Notification,
   setProfileCompletedForTesting?: boolean,
   customUserIdForTesting?: string,
   isAdmin?: boolean,
   currentTraversal?: Traversal,
): Traversal {
   return queryToGetUserByToken(token, currentTraversal)
      .fold()
      .coalesce(
         __.unfold(),
         __.addV("user")
            .property("token", token)
            .property("userId", customUserIdForTesting ?? generateId())
            .property("email", email)
            .property("language", DEFAULT_LANGUAGE)
            .property("profileCompleted", setProfileCompletedForTesting ?? false)
            .property("isAdmin", isAdmin === true ? true : false)
            .property("sendNewUsersNotification", -1)
            .property("lastGroupJoinedDate", moment().unix())
            .property("notifications", `[${JSON.stringify(welcomeNotification)}]`),
      )
      .unfold();
}

export function queryToGetUserByTokenOrId(tokenOrId: TokenOrId): Traversal {
   if (checkTypeByMember(tokenOrId, "token")) {
      return queryToGetUserByToken(tokenOrId.token);
   } else if (checkTypeByMember(tokenOrId, "userId")) {
      return queryToGetUserById(tokenOrId.userId);
   } else {
      return null;
   }
}

export function queryToGetUserByToken(
   token: string,
   currentTraversal?: Traversal,
   onlyCompleteUsers?: boolean,
): Traversal {
   if (currentTraversal == null) {
      currentTraversal = (g as unknown) as Traversal;
   }
   currentTraversal = currentTraversal.V().has("user", "token", String(token));

   if (onlyCompleteUsers) {
      currentTraversal = hasProfileCompleted(currentTraversal);
   }

   return currentTraversal;
}

export function queryToGetUserByEmail(email: string, currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = (g as unknown) as Traversal;
   }

   return currentTraversal.V().has("user", "email", String(email));
}

export function queryToGetUserById(
   userId: string,
   currentTraversal?: Traversal,
   onlyCompleteUsers?: boolean,
): Traversal {
   if (currentTraversal == null) {
      currentTraversal = (g as unknown) as Traversal;
   }

   currentTraversal = currentTraversal.V().has("user", "userId", String(userId));

   if (onlyCompleteUsers) {
      currentTraversal = hasProfileCompleted(currentTraversal);
   }

   return currentTraversal;
}

export function queryToGetUsersListFromIds(usersIds: string[], currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = (g as unknown) as Traversal;
   }
   currentTraversal = currentTraversal.V().hasLabel("user");

   const search = usersIds.map(userId => __.has("userId", userId));
   return currentTraversal.or(...search);
}

/**
 * Receives a user traversal and returns the user only if has the profile completed
 */
export function hasProfileCompleted(currentTraversal?: Traversal): Traversal {
   return currentTraversal.has("user", "profileCompleted", true);
}

export async function queryToUpdateUserToken(userEmail: string, newToken: string): Promise<void> {
   await sendQuery(() => g.V().has("user", "email", userEmail).property("token", newToken).next());
}

export async function queryToUpdateUserProps(
   tokenOrTraversal: string | Traversal,
   props: Array<{ key: keyof User; value: ValueOf<User> }>,
): Promise<void> {
   await sendQuery(() => {
      let query =
         typeof tokenOrTraversal === "string" ? queryToGetUserByToken(tokenOrTraversal) : tokenOrTraversal;

      for (const prop of props) {
         query = query.property(prop.key, serializeIfNeeded(prop.value));
      }

      return query.next();
   });
}

export function queryToGetAllUsers(): Traversal {
   return g.V().hasLabel("user");
}

export function queryToGetAllCompleteUsers(): Traversal {
   return queryToGetAllUsers().has("profileCompleted", true);
}

/**
 * Only used in tests.
 * If no user list is provided all users on the database are removed.
 */
export async function queryToRemoveUsers(users?: Array<Partial<User>>): Promise<void> {
   if (users == null) {
      await sendQuery(() => queryToGetAllUsers().drop().iterate());
   } else {
      const ids: string[] = users.map(u => u.userId);
      await sendQuery(() =>
         g
            .inject(ids)
            .unfold()
            .map(
               __.as("targetUserId")
                  .V()
                  .hasLabel("user")
                  .has("userId", __.where(P.eq("targetUserId")))
                  .drop(),
            )
            .iterate(),
      );
   }

   // This helps a little to mitigate NegativeArraySizeException Gremlin Server bug
   await time(500);
}

/**
 * Receives a query that returns a user and adds properties to it.
 * @param query A query with one user vertex
 */
export function queryToSetUserProps(query: Traversal, userProps: EditableUserProps): Traversal {
   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] == null) {
         return;
      }

      query = query.property(editableUserProp, serializeIfNeeded(userProps[editableUserProp]));
   });

   return query;
}

export function queryToSetAttraction(params: SetAttractionParams): Traversal {
   const traversalInit = g.withSideEffect("injectedData", params.attractions);
   return hasProfileCompleted(queryToGetUserByToken(params.token, (traversalInit as unknown) as Traversal))
      .as("user")
      .select("injectedData")
      .unfold()
      .map(
         // Prepare the as()
         __.as("attractionData")
            .select("attractionType")
            .as("attractionType")
            .select("attractionData")
            .select("userId")
            .as("targetUserId")

            // Get the target user
            .V()
            .hasLabel("user")
            .has("userId", __.where(P.eq("targetUserId")))

            // This prevents self like
            .not(__.has("token", params.token))

            // On seen matches is not possible to edit the attraction anymore
            .not(__.both("SeenMatch").where(P.eq("user")))

            .as("targetUser")

            // Removes all edges pointing to the target user that are labeled as any attraction type (like or dislike)
            .sideEffect(
               __.inE(...allAttractionTypes)
                  .where(__.outV().as("user"))
                  .drop(),
            )

            // Also remove the match edge because at this point we don't know if they are going to match
            .sideEffect(__.bothE("Match").where(__.bothV().as("user")).drop())

            // Now we can add the new edge
            .addE(__.select("attractionType"))
            .property("timestamp", moment().unix())
            .from_("user")

            // If the users like each other add a Match edge
            .select("targetUser")
            .and(
               __.out("Like").where(P.eq("user")),
               __.in_("Like").where(P.eq("user")),
               __.not(__.both("Match").where(P.eq("user"))),
            )
            .addE("Match")
            .from_("user")
            .property("timestamp", moment().unix()),
      );
}

export function queryToGetMatches(token: string): Traversal {
   return queryToGetUserByToken(token).both(...allMatchTypes);
}

export function queryToGetAttractionsSent(token: string, types?: AttractionType[]): Traversal {
   types = types ?? allAttractionTypes;
   return queryToGetUserByToken(token)
      .as("user")
      .out(...types)
      .where(__.not(__.both(...allMatchTypes).as("user")));
}

export function queryToGetAttractionsReceived(token: string, types?: AttractionType[]): Traversal {
   types = types ?? allAttractionTypes;
   return queryToGetUserByToken(token)
      .as("user")
      .in_(...types)
      .where(__.not(__.both(...allMatchTypes).as("user")));
}

export function queryToIncludeFullInfoInUserQuery(traversal: Traversal): Traversal {
   return traversal.map(
      __.union(
         // Include all user props
         __.valueMap().by(__.unfold()),
         // Include tags subscribed
         __.project("tagsSubscribed").by(__.out("subscribed").valueMap("tagId", "name").by(__.unfold()).fold()),
         // Include tags blocked
         __.project("tagsBlocked").by(__.out("blocked").valueMap("tagId", "name").by(__.unfold()).fold()),
      )
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );
}
