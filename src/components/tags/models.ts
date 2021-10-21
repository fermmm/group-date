import { ValidationError } from "fastest-validator";
import { BaseContext } from "koa";
import * as moment from "moment";
import {
   APP_AUTHORED_TAGS,
   APP_AUTHORED_TAGS_AS_QUESTIONS,
   TAGS_PER_TIME_FRAME,
   TAG_CREATION_TIME_FRAME,
} from "../../configurations";
import { fromQueryToTag, fromQueryToTagList } from "./tools/data-conversion";
import { Traversal } from "../../common-tools/database-tools/gremlin-typing-tools";
import { __ } from "../../common-tools/database-tools/database-manager";
import { t, LocaleConfigurationSources } from "../../common-tools/i18n-tools/i18n-tools";
import {
   Tag,
   TagCreateParams,
   TagGetParams,
   BasicTagParams,
   TagsAsQuestion,
} from "../../shared-tools/endpoints-interfaces/tags";
import { Gender, User } from "../../shared-tools/endpoints-interfaces/user";
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

export async function initializeTags(): Promise<void> {
   await creteAppAuthoredTags();
}

export async function createTagPost(params: TagCreateParams, ctx: BaseContext): Promise<Tag> {
   const user: User = await retrieveFullyRegisteredUser(params.token, false, ctx);

   if (!user.isAdmin && params.global) {
      ctx.throw(400, t("Only admin users can create global tags", { user }));
      return;
   }

   if (!user.isAdmin && params.country) {
      ctx.throw(400, t("Only admin users can set the tag country", { user }));
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

   const userTagsTraversal: Traversal = queryToGetTags({ countryFilter: params.country ?? user.country });
   const userTags: Tag[] = await fromQueryToTagList(userTagsTraversal);
   const matchingTag: Tag = userTags.find(tag => tag.name.toLowerCase() === params.name.toLowerCase());

   if (matchingTag != null) {
      ctx.throw(400, t("A tag with the same name already exists in your country", { user }));
      return;
   }

   const tagToCreate: Tag = {
      tagId: generateId(),
      name: params.name,
      category: params.category.toLowerCase(),
      country: params.country ?? user.country,
      creationDate: params.creationDate ?? moment().unix(),
      lastInteractionDate: params.lastInteractionDate ?? moment().unix(),
      global: params.global ?? false,
      subscribersAmount: params.fakeSubscribersAmount ?? 0,
      blockersAmount: params.fakeBlockersAmount ?? 0,
   };

   return await fromQueryToTag(queryToCreateTags(user.userId, [tagToCreate]));
}

export async function tagsGet(params: TagGetParams, ctx: BaseContext): Promise<Tag[]> {
   const user: Partial<User> = await retrieveUser(params.token, false, ctx);

   if (!user.country) {
      ctx.throw(400, "Reading tags without country selected, please report this error", { user });
      return;
   }

   let result: Tag[];
   result = await fromQueryToTagList(queryToGetTags({ countryFilter: user.country }));
   result = translateAppAuthoredTags(result, { user });
   return result;
}

export function appAuthoredTagsAsQuestionsGet(params: null, ctx: BaseContext): TagsAsQuestion[] {
   return translateAppAuthoredTagsAsQuestions(APP_AUTHORED_TAGS_AS_QUESTIONS, ctx);
}

export async function tagsCreatedByUserGet(token: string) {
   return await fromQueryToTagList(queryToGetTagsCreatedByUser(token));
}

export async function subscribeToTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(queryToRelateUserWithTag(params.token, params.tagIds, "subscribed", false));
}

export async function blockTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(queryToRelateUserWithTag(params.token, params.tagIds, "blocked", false));
}

export async function removeSubscriptionToTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(queryToRelateUserWithTag(params.token, params.tagIds, "subscribed", true));
}

export async function removeBlockToTagsPost(params: BasicTagParams): Promise<Tag[]> {
   return await fromQueryToTagList(queryToRelateUserWithTag(params.token, params.tagIds, "blocked", true));
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

export async function creteAppAuthoredTags() {
   // Create raw app authored tags
   const tagsToCreate: Array<Partial<Tag>> = APP_AUTHORED_TAGS.map(tag => ({
      ...tag,
      country: "all",
      creationDate: moment().unix(),
      lastInteractionDate: moment().unix(),
      global: true,
      visible: true,
   }));

   // Crete app authored tags that are saved as questions
   tagsToCreate.push(
      ...APP_AUTHORED_TAGS_AS_QUESTIONS.map(question =>
         question.answers.map(answer => ({
            tagId: answer.tagId,
            category: answer.category,
            name: answer.tagName,
            country: "all",
            creationDate: moment().unix(),
            lastInteractionDate: moment().unix(),
            global: true,
            visible: true,
         })),
      ).flat(),
   );

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

   APP_AUTHORED_TAGS_AS_QUESTIONS.forEach(tagQ => {
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
 * App authored tags are global, this means any country will see the tags, so translation is needed.
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

function translateAppAuthoredTagsAsQuestions(
   rawQuestions: TagsAsQuestion[],
   ctx: BaseContext,
): TagsAsQuestion[] {
   return rawQuestions.map(q => ({
      ...q,
      text: t(q.text, { ctx }),
      extraText: q.extraText != null ? t(q.extraText, { ctx }) : null,
      answers: q.answers.map(a => ({
         ...a,
         text: t(a.text, { ctx }),
         category: t(a.category, { ctx }),
         tagName: a.tagName != null ? t(a.tagName, { ctx }) : null,
      })),
   }));
}

let catchedAppAuthoredQuestions = null;
export function getAppAuthoredQuestionsIdsAsSet(): Set<string> {
   if (catchedAppAuthoredQuestions == null) {
      const result = new Set<string>();
      APP_AUTHORED_TAGS.forEach(q => result.add(q.tagId));
      APP_AUTHORED_TAGS_AS_QUESTIONS.forEach(q => q.answers.forEach(a => result.add(a.tagId)));
      catchedAppAuthoredQuestions = result;
   }
   return catchedAppAuthoredQuestions;
}
