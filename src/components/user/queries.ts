import { serializeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";
import { __, P, sendQuery, g, column, cardinality } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import {
   allAttractionTypes,
   allMatchTypes,
   AttractionType,
   Gender,
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

export function queryToCreateUser(props: {
   token: string;
   email: string;
   setProfileCompletedForTesting?: boolean;
   customUserIdForTesting?: string;
   isAdmin?: boolean;
   currentTraversal?: Traversal;
}): Traversal {
   const { token, email, setProfileCompletedForTesting, customUserIdForTesting, isAdmin, currentTraversal } =
      props;

   return queryToGetUserByToken(token, currentTraversal)
      .fold()
      .coalesce(
         __.unfold(),
         __.addV("user")
            .property(cardinality.single, "token", token)
            .property(cardinality.single, "userId", customUserIdForTesting ?? generateId())
            .property(cardinality.single, "email", email)
            .property(cardinality.single, "language", DEFAULT_LANGUAGE)
            .property(cardinality.single, "profileCompleted", setProfileCompletedForTesting ?? false)
            .property(cardinality.single, "isAdmin", isAdmin === true ? true : false)
            .property(cardinality.single, "sendNewUsersNotification", -1)
            .property(cardinality.single, "lastGroupJoinedDate", moment().unix())
            .property(cardinality.single, "registrationDate", moment().unix())
            .property(cardinality.single, "imagesAmount", 0)
            .property(cardinality.single, "notifications", `[]`),
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
      currentTraversal = g as unknown as Traversal;
   }
   currentTraversal = currentTraversal.V().has("user", "token", String(token));

   if (onlyCompleteUsers) {
      currentTraversal = hasProfileCompleted(currentTraversal);
   }

   return currentTraversal;
}

export function queryToGetUserByEmail(email: string, currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g as unknown as Traversal;
   }

   return currentTraversal.V().has("user", "email", String(email));
}

export function queryToGetUserById(
   userId: string,
   currentTraversal?: Traversal,
   onlyCompleteUsers?: boolean,
): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g as unknown as Traversal;
   }

   currentTraversal = currentTraversal.V().has("user", "userId", String(userId));

   if (onlyCompleteUsers) {
      currentTraversal = hasProfileCompleted(currentTraversal);
   }

   return currentTraversal;
}

export function queryToGetUsersListFromIds(usersIds: string[], currentTraversal?: Traversal): Traversal {
   if (currentTraversal == null) {
      currentTraversal = g as unknown as Traversal;
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

export function isNotDemoAccount(currentTraversal?: Traversal): Traversal {
   return currentTraversal.not(__.has("demoAccount", true));
}

/**
 * Receives a traversal with a user and updates the token.
 */
export async function queryToUpdateUserToken(traversal: Traversal, newToken: string): Promise<void> {
   await sendQuery(() => traversal.property(cardinality.single, "token", newToken).next());
}

export async function queryToUpdateUserProps(
   tokenOrTraversal: string | Traversal,
   props: Array<{ key: keyof User; value: ValueOf<User> }>,
): Promise<void> {
   await sendQuery(() => {
      let query =
         typeof tokenOrTraversal === "string" ? queryToGetUserByToken(tokenOrTraversal) : tokenOrTraversal;

      for (const prop of props) {
         query = query.property(cardinality.single, prop.key, serializeIfNeeded(prop.value));
      }

      return query.next();
   });
}

export function queryToGetAllUsers(props?: { includeDemoAccounts?: boolean }): Traversal {
   const { includeDemoAccounts = false } = props ?? {};

   let traversal = g.V().hasLabel("user");

   if (!includeDemoAccounts) {
      traversal = traversal.not(__.has("demoAccount", true));
   }

   return traversal;
}

export function queryToGetAllCompleteUsers(props?: { includeDemoAccounts?: boolean }): Traversal {
   return queryToGetAllUsers(props).has("profileCompleted", true);
}

export function queryToGetAllDemoUsers(): Traversal {
   return g.V().has("user", "demoAccount", true);
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
 * @param traversal A query with one user vertex
 */
export function queryToSetUserProps(traversal: Traversal, userProps: Partial<User>): Traversal {
   editableUserPropsList.forEach(editableUserProp => {
      if (userProps[editableUserProp] == null) {
         return;
      }

      traversal = traversal.property(
         cardinality.single,
         editableUserProp,
         serializeIfNeeded(userProps[editableUserProp]),
      );
   });

   if (userProps.images?.length > 0) {
      traversal = traversal.property(cardinality.single, "imagesAmount", userProps.images?.length);
   }

   if (userProps.genders?.length > 0) {
      traversal = queryToSetUserGender(traversal, userProps.genders);
   }

   if (userProps.likesGenders?.length > 0) {
      traversal = queryToSetLikingGender(traversal, userProps.likesGenders);
   }

   return traversal;
}

export function queryToSetAttraction(params: SetAttractionParams): Traversal {
   const traversalInit = g.withSideEffect("injectedData", params.attractions);
   return isNotDemoAccount(
      hasProfileCompleted(queryToGetUserByToken(params.token, traversalInit as unknown as Traversal)),
   )
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
         __.project("tagsSubscribed").by(
            __.out("subscribed").valueMap("tagId", "name", "visible").by(__.unfold()).fold(),
         ),
         // Include tags blocked
         __.project("tagsBlocked").by(
            __.out("blocked").valueMap("tagId", "name", "visible").by(__.unfold()).fold(),
         ),

         /**
          * This is not required because genders list are also saved as user props and that
          * is faster to get than browsing the edges.
          */
         // Include gender
         // __.project("genders").by(__.out("isGender").values("genderId").fold()),
         // Include genders liked
         // __.project("likesGenders").by(__.out("likesGender").values("genderId").fold()),
      )
         .unfold()
         .group()
         .by(__.select(column.keys))
         .by(__.select(column.values)),
   );
}

/**
 * Receives a traversal that selects one or more users and sets the gender
 */
export function queryToSetUserGender(traversal: Traversal, genders: Gender[]): Traversal {
   return traversal
      .as("user")
      .sideEffect(__.outE("isGender").drop())
      .sideEffect(
         __.V()
            .union(...genders.map(gender => __.has("gender", "genderId", gender)))
            .addE("isGender")
            .from_("user"),
      );
}

/**
 * Receives a traversal that selects one or more users and sets the gender liked
 */
export function queryToSetLikingGender(traversal: Traversal, genders: Gender[]): Traversal {
   return traversal
      .as("user")
      .sideEffect(__.outE("likesGender").drop())
      .sideEffect(
         __.V()
            .union(...genders.map(gender => __.has("gender", "genderId", gender)))
            .addE("likesGender")
            .from_("user"),
      );
}
