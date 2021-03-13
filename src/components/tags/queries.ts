import * as moment from "moment";
import { queryToCreateVerticesFromObjects } from "../../common-tools/database-tools/common-queries";
import { column, g, P, __ } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { MAX_TAG_SUBSCRIPTIONS_ALLOWED } from "../../configurations";
import { Tag, TagRelationShip } from "../../shared-tools/endpoints-interfaces/tags";
import { queryToGetUserById, queryToGetUserByToken } from "../user/queries";

export function queryToCreateTags(userId: string, tagsToCreate: Array<Partial<Tag>>): Traversal {
   const traversal: Traversal = queryToCreateVerticesFromObjects(tagsToCreate, "tag", "tagId");

   if (userId == null) {
      return traversal;
   }

   return traversal
      .fold()
      .as("t")
      .union(queryToGetUserById(userId, __).as("user"))
      .select("t")
      .unfold()
      .sideEffect(
         __.map(
            // Create an edge to keep track of who created the tag
            __.sideEffect(__.addE("createdTag").from_("user")),
         ),
      );
}

export function queryToGetTags(filters?: { countryFilter?: string }): Traversal {
   const filtersAsTraversal: Traversal[] = [__.has("global", true)];

   if (filters?.countryFilter != null) {
      filtersAsTraversal.push(__.has("country", filters.countryFilter));
   }

   return g
      .V()
      .hasLabel("tag")
      .or(...filtersAsTraversal);
}

/**
 * @param timeFilter This filter the results by time, for example: pass a week (in seconds) the get the tags created in the last week
 */
export function queryToGetTagsCreatedByUser(token: string, timeFilter?: number): Traversal {
   let traversal: Traversal = queryToGetUserByToken(token)
      .as("user")
      .out("createdTag")
      .where(P.eq("user"))
      .by("country")
      .by("country");

   if (timeFilter != null) {
      traversal = traversal.where(__.values("creationDate").is(P.gte(moment().unix() - timeFilter)));
   }

   return traversal;
}

/**
 * To play with the query:
 * https://gremlify.com/xeqxrbq7uv8
 *
 * @param relation The relation to add or remove
 * @param remove true = adds the relation. false = removes the relation
 */
export function queryToRelateUserWithTag(
   token: string,
   tagsIds: string[],
   relation: TagRelationShip,
   remove: boolean,
): Traversal {
   let relationTraversal: Traversal;

   if (remove) {
      relationTraversal = __.inE(relation).where(__.outV().has("token", token)).drop();
   } else {
      relationTraversal = __.coalesce(__.in_(relation).where(P.eq("user")), __.addE(relation).from_("user"));

      // For subscribing there is a maximum of tags a user can subscribe per country
      if (relation === "subscribed") {
         relationTraversal = __.coalesce(
            __.select("user")
               .out("subscribed")
               .where(P.eq("tag"))
               .by("country")
               .by("country")
               .count()
               .is(P.gte(MAX_TAG_SUBSCRIPTIONS_ALLOWED)),
            relationTraversal,
         );
      }
   }

   return g
      .inject(tagsIds)
      .as("tags")
      .union(queryToGetUserByToken(token, __).as("user"))
      .select("tags")
      .unfold()
      .map(
         __.as("tagId")
            .V()
            .hasLabel("tag")
            .has("tagId", __.where(P.eq("tagId")))
            .as("tag")
            .sideEffect(relationTraversal)
            .property("lastInteractionDate", moment().unix())
            .property("subscribersAmount", __.inE("subscribed").count())
            .property("blockersAmount", __.inE("blocked").count()),
      );
}

export function queryToGetUsersSubscribedToTags(tagsIds: string[]): Traversal {
   return g
      .inject(tagsIds)
      .unfold()
      .flatMap(
         __.as("tagId")
            .V()
            .hasLabel("tag")
            .has("tagId", __.where(P.eq("tagId")))
            .in_("subscribed"),
      );
}

export function queryToRemoveTags(tagsIds: string[]): Traversal {
   return g
      .inject(tagsIds)
      .unfold()
      .map(
         __.as("tagId")
            .V()
            .hasLabel("tag")
            .has("tagId", __.where(P.eq("tagId")))
            .drop(),
      );
}
