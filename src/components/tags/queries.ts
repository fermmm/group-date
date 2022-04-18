import * as moment from "moment";
import { queryToCreateVerticesFromObjects } from "../../common-tools/database-tools/common-queries";
import { cardinality, g, P, __ } from "../../common-tools/database-tools/database-manager";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { MAX_TAG_SUBSCRIPTIONS_ALLOWED } from "../../configurations";
import { Tag, TagRelationShip } from "../../shared-tools/endpoints-interfaces/tags";
import { queryToGetUserById, queryToGetUserByToken } from "../user/queries";

export function queryToCreateTags(userId: string, tagsToCreate: Array<Partial<Tag>>): Traversal {
   const traversal: Traversal = queryToCreateVerticesFromObjects({
      objects: tagsToCreate,
      label: "tag",
      duplicationAvoidanceProperty: "tagId",
   });

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

/**
 * Set languageFilter as "all" to return tags from all languages, useful for admins.
 */
export function queryToGetTags(filters?: { languageFilter?: string }): Traversal {
   const filtersAsTraversal: Traversal[] = [__.has("global", true)];

   if (filters?.languageFilter != "all") {
      filtersAsTraversal.push(__.has("language", filters.languageFilter));
   } else {
      filtersAsTraversal.push(__.has("language")); // This includes all languages into the query
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
      .by("language")
      .by("language");

   if (timeFilter != null) {
      traversal = traversal.where(__.values("creationDate").is(P.gte(moment().unix() - timeFilter)));
   }

   return traversal;
}

/**
 * To play with the query:
 * https://gremlify.com/vjy2kp7jp2
 *
 * @param relation The relation to add or remove
 * @param remove true = adds the relation. false = removes the relation
 */
export function queryToRelateUserWithTag(props: {
   token: string;
   tagIds: string[];
   relation: TagRelationShip;
   remove: boolean;
   maxSubscriptionsAllowed?: number;
}): Traversal {
   const { token, tagIds, relation, remove, maxSubscriptionsAllowed = MAX_TAG_SUBSCRIPTIONS_ALLOWED } = props;

   let relationTraversal: Traversal;

   if (remove) {
      relationTraversal = __.inE(relation).where(__.outV().has("token", token)).drop();
   } else {
      relationTraversal = __.coalesce(__.in_(relation).where(P.eq("user")), __.addE(relation).from_("user"));

      // For subscribing there is a maximum of tags a user can subscribe per language
      if (relation === "subscribed") {
         relationTraversal = __.coalesce(
            __.select("user")
               .out("subscribed")
               .where(P.eq("tag"))
               // .by("language")   // This used to be a way to allow users to subscribe to more tags if they are in a different language
               // .by("language")
               .count()
               .is(P.gte(maxSubscriptionsAllowed)),
            relationTraversal,
         );
      }
   }

   return g
      .inject(tagIds)
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
            .property(cardinality.single, "lastInteractionDate", moment().unix())
            .property(cardinality.single, "subscribersAmount", __.inE("subscribed").count())
            .property(cardinality.single, "blockersAmount", __.inE("blocked").count()),
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
