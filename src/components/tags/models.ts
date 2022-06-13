import { ValidationError } from "fastest-validator";
import { BaseContext } from "koa";
import * as moment from "moment";
import {
   APP_AUTHORED_TAGS,
   SETTINGS_AS_QUESTIONS,
   MAX_TAG_SUBSCRIPTIONS_ALLOWED,
   TAGS_PER_TIME_FRAME,
   TAG_CREATION_TIME_FRAME,
} from "../../configurations";
import { fromQueryToTag, fromQueryToTagList } from "./tools/data-conversion";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { __ } from "../../common-tools/database-tools/database-manager";
import { t, LocaleConfigurationSources, findLocaleIn } from "../../common-tools/i18n-tools/i18n-tools";
import {
   Tag,
   TagCreateParams,
   TagGetParams,
   BasicTagParams,
} from "../../shared-tools/endpoints-interfaces/tags";
import { User } from "../../shared-tools/endpoints-interfaces/user";
import { validateTagProps } from "../../shared-tools/validators/tags";
import { retrieveFullyRegisteredUser, retrieveUser } from "../user/models";
import { generateId } from "../../common-tools/string-tools/string-tools";
import {
   queryToCreateTags,
   queryToGetTagsCreatedByUser,
   queryToGetTags,
   queryToRelateUserWithTag,
   queryToRemoveTags,
} from "./queries";
import { queryToCreateVerticesFromObjects } from "../../common-tools/database-tools/common-queries";
import { encodeIfNeeded } from "../../common-tools/database-tools/data-conversion-tools";

export async function initializeTags(): Promise<void> {
   await createAppAuthoredTags();
}

export async function createTagPost(params: TagCreateParams, ctx: BaseContext): Promise<Tag> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin && params.global) {
      ctx.throw(400, t("Only admin users can create global tags", { user }));
      return;
   }

   if (!user.isAdmin && params.language) {
      ctx.throw(400, t("Only admin users can set the tag language", { user }));
      return;
   }

   if (user.demoAccount) {
      ctx.throw(400, "Demo users cannot publish tags");
      return;
   }

   if (
      !user.isAdmin &&
      (params.fakeSubscribersAmount != null ||
         params.fakeBlockersAmount != null ||
         params.creationDate != null ||
         params.lastInteractionDate != null)
   ) {
      ctx.throw(400, t("Only admin users can set a fake information", { user }));
      return;
   }

   const validationResult: true | ValidationError[] | Promise<true | ValidationError[]> =
      validateTagProps(params);
   if (validationResult !== true) {
      ctx.throw(400, JSON.stringify(validationResult));
      return;
   }

   const tagsCreatedByUserTraversal: Traversal = queryToGetTagsCreatedByUser(
      user.token,
      TAG_CREATION_TIME_FRAME,
   );
   const tagsCreatedByUser: Tag[] = await fromQueryToTagList(tagsCreatedByUserTraversal);

   if (tagsCreatedByUser.length >= TAGS_PER_TIME_FRAME && !user.isAdmin) {
      const remaining = moment
         .duration(getRemainingTimeToCreateNewTag(tagsCreatedByUser), "seconds")
         .locale(user.language)
         .humanize();

      ctx.throw(400, t("Sorry you created too many tags", { user }, remaining));
      return;
   }

   const userTagsTraversal: Traversal = queryToGetTags({ languageFilter: findLocaleIn({ user, ctx }) });
   const userTags: Tag[] = await fromQueryToTagList(userTagsTraversal);
   const matchingTag: Tag = userTags.find(tag => tag.name.toLowerCase() === params.name.toLowerCase());

   if (matchingTag != null) {
      ctx.throw(400, t("A tag with the same name already exists", { user }));
      return;
   }

   const tagToCreate: Tag = {
      tagId: generateId(),
      name: params.name,
      category: params.category.toLowerCase(),
      language: params.language ?? findLocaleIn({ user, ctx }),
      creationDate: params.creationDate ?? moment().unix(),
      lastInteractionDate: params.lastInteractionDate ?? moment().unix(),
      global: params.global ?? false,
      subscribersAmount: params.fakeSubscribersAmount ?? 0,
      blockersAmount: params.fakeBlockersAmount ?? 0,
   };

   Object.keys(tagToCreate).forEach(key => {
      tagToCreate[key] = encodeIfNeeded(tagToCreate[key], key, "tag");
   });

   /*
    * Banned or unwanted users cannot create tags but since it's a shadow ban we don't return an error, we
    * return the tag object instead, like if it was created successfully but we are not calling
    * the database query
    */
   if (user.banReasonsAmount > 0 || user.unwantedUser) {
      return tagToCreate;
   }

   return await fromQueryToTag(queryToCreateTags(user.userId, [tagToCreate]));
}

export async function tagsGet(params: TagGetParams, ctx: BaseContext): Promise<Tag[]> {
   const user: Partial<User> = await retrieveUser(params.token, false, ctx);
   const language = findLocaleIn({ user, ctx });

   if (!language) {
      ctx.throw(400, "Reading tags and language not found, please report this error", { user });
      return;
   }

   let result: Tag[];
   result = await fromQueryToTagList(queryToGetTags({ languageFilter: findLocaleIn({ user, ctx }) }));
   result = translateAppAuthoredTags(result, { user });
   return result;
}

export async function tagsCreatedByUserGet(token: string) {
   return await fromQueryToTagList(queryToGetTagsCreatedByUser(token));
}

export async function subscribeToTagsPost(params: BasicTagParams, ctx: BaseContext): Promise<Tag[]> {
   const maxSubscriptionsAllowed =
      MAX_TAG_SUBSCRIPTIONS_ALLOWED + APP_AUTHORED_TAGS.length + SETTINGS_AS_QUESTIONS.length;

   const user = await retrieveUser(params.token, true, ctx);

   // Max tags allowed should also sum the tags the user does not know he/she is subscribed to
   if (user.tagsSubscribed?.length >= maxSubscriptionsAllowed) {
      ctx.throw(
         400,
         t(
            "You can subscribe to a maximum of %s tags, tap on 'My tags' button and remove the subscriptions to tags that are less important for you",
            { user },
            String(maxSubscriptionsAllowed),
         ),
      );
      return;
   }

   // If the tags to subscribe array is bigger than the amount of tags allowed, we change the length
   if (params.tagIds.length + (user.tagsSubscribed?.length ?? 0) > maxSubscriptionsAllowed) {
      params.tagIds.length = maxSubscriptionsAllowed - (user.tagsSubscribed?.length ?? 0);
   }

   const result = await fromQueryToTagList(
      queryToRelateUserWithTag({
         token: params.token,
         tagIds: params.tagIds,
         relation: "subscribed",
         remove: false,
         maxSubscriptionsAllowed,
      }),
   );

   return result;
}

export async function blockTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(
      queryToRelateUserWithTag({
         token: params.token,
         tagIds: params.tagIds,
         relation: "blocked",
         remove: false,
      }),
   );
}

export async function removeSubscriptionToTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(
      queryToRelateUserWithTag({
         token: params.token,
         tagIds: params.tagIds,
         relation: "subscribed",
         remove: true,
      }),
   );
}

export async function removeBlockToTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(
      queryToRelateUserWithTag({
         token: params.token,
         tagIds: params.tagIds,
         relation: "blocked",
         remove: true,
      }),
   );
}

export async function removeTagsPost(params: BasicTagParams, ctx: BaseContext): Promise<void> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin) {
      const tagsCreatedByUser: Tag[] = await tagsCreatedByUserGet(params.token);

      for (const tag of params.tagIds) {
         const tagFound = tagsCreatedByUser.find(ut => ut.tagId === tag);
         if (tagFound == null) {
            ctx.throw(400, t("Only admin users can remove tags created by anyone", { user }));
            return;
         }
         if (tagFound.subscribersAmount > 0 || tagFound.blockersAmount > 0) {
            ctx.throw(
               400,
               t(
                  "Sorry, %s users have interacted with your tag, it cannot be removed anymore",
                  { user },
                  String(tagFound.subscribersAmount + tagFound.blockersAmount),
               ),
            );
            return;
         }
      }
   }

   await queryToRemoveTags(params.tagIds).iterate();
}

export async function createAppAuthoredTags() {
   // Create raw app authored tags
   const tagsToCreate: Array<Partial<Tag>> = APP_AUTHORED_TAGS.map(tag => ({
      ...tag,
      language: "all",
      creationDate: moment().unix(),
      lastInteractionDate: moment().unix(),
      global: true,
      visible: true,
   }));

   SETTINGS_AS_QUESTIONS.forEach(question => {
      question.answers.forEach(answer => {
         if (answer.subscribesToTags) {
            tagsToCreate.push(
               ...answer.subscribesToTags.map(tag => ({
                  tagId: tag.tagId,
                  category: tag.category,
                  name: tag.tagName,
                  visible: tag.tagIsVisible ?? false,
                  language: "all",
                  creationDate: moment().unix(),
                  lastInteractionDate: moment().unix(),
                  global: true,
               })),
            );
         }
      });
   });

   await fromQueryToTag(
      queryToCreateVerticesFromObjects({
         objects: tagsToCreate,
         label: "tag",
         duplicationAvoidanceProperty: "tagId",
      }),
   );
}

/**
 * This is currently being used to clean tests only
 */
export async function removeAllTagsCreatedBy(users: User[]): Promise<void> {
   const result: Tag[] = [];
   for (const user of users) {
      result.push(...(await tagsCreatedByUserGet(user.token)));
   }
   await queryToRemoveTags(result.map(tag => tag.tagId)).iterate();
}

export function getNotShowedQuestionIds(user: Partial<User>): string[] {
   const result: string[] = [];

   SETTINGS_AS_QUESTIONS.forEach(tagQ => {
      const foundInUser = user.questionsShowed?.find(q => q === tagQ.questionId);
      if (foundInUser == null) {
         result.push(tagQ.questionId);
      }
   });
   return result;
}

function getRemainingTimeToCreateNewTag(tags: Tag[]): number {
   const oldestTag: Tag = tags.reduce((result, tag) => {
      // Tag is not inside the creation time frame
      if (tag.creationDate < moment().unix() - TAG_CREATION_TIME_FRAME) {
         return result;
      }

      if (result == null) {
         return tag;
      }

      // Tag is older than current
      if (tag.creationDate < result.creationDate) {
         return tag;
      }

      return result;
   }, null);

   let secondsLeft: number = 0;
   if (oldestTag != null) {
      secondsLeft = TAG_CREATION_TIME_FRAME - (moment().unix() - oldestTag.creationDate);
   }

   return secondsLeft;
}

/**
 * App authored tags are global, this means any language will see the tags, so translation is needed.
 */
function translateAppAuthoredTags(tags: Tag[], localeSource: LocaleConfigurationSources): Tag[] {
   const appAuthoredIds: Set<string> = getAppAuthoredQuestionsIdsAsSet();

   return tags.map(tag => {
      if (!appAuthoredIds.has(tag.tagId)) {
         return tag;
      }

      return {
         ...tag,
         category: t(tag.category, localeSource),
         name: t(tag.name, localeSource),
      };
   });
}

let catchedAppAuthoredQuestions = null;
export function getAppAuthoredQuestionsIdsAsSet(): Set<string> {
   if (catchedAppAuthoredQuestions == null) {
      const result = new Set<string>();
      APP_AUTHORED_TAGS.forEach(q => result.add(q.tagId));
      SETTINGS_AS_QUESTIONS.forEach(q =>
         q.answers.forEach(a => a.subscribesToTags.forEach(t => result.add(t.tagId))),
      );
      catchedAppAuthoredQuestions = result;
   }
   return catchedAppAuthoredQuestions;
}
