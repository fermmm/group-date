"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppAuthoredQuestionsIdsAsSet = exports.getNotShowedQuestionIds = exports.removeAllTagsCreatedBy = exports.createAppAuthoredTags = exports.removeTagsPost = exports.removeBlockToTagsPost = exports.removeSubscriptionToTagsPost = exports.blockTagsPost = exports.subscribeToTagsPost = exports.tagsCreatedByUserGet = exports.appAuthoredTagsAsQuestionsGet = exports.tagsGet = exports.createTagPost = exports.initializeTags = void 0;
const moment = require("moment");
const configurations_1 = require("../../configurations");
const data_conversion_1 = require("./tools/data-conversion");
const i18n_tools_1 = require("../../common-tools/i18n-tools/i18n-tools");
const tags_1 = require("../../shared-tools/validators/tags");
const models_1 = require("../user/models");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const queries_1 = require("./queries");
const common_queries_1 = require("../../common-tools/database-tools/common-queries");
async function initializeTags() {
    await createAppAuthoredTags();
}
exports.initializeTags = initializeTags;
async function createTagPost(params, ctx) {
    var _a, _b, _c, _d, _e, _f;
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, false, ctx);
    if (!user.isAdmin && params.global) {
        ctx.throw(400, (0, i18n_tools_1.t)("Only admin users can create global tags", { user }));
        return;
    }
    if (!user.isAdmin && params.language) {
        ctx.throw(400, (0, i18n_tools_1.t)("Only admin users can set the tag language", { user }));
        return;
    }
    if (user.demoAccount) {
        ctx.throw(400, "Demo users cannot publish tags");
        return;
    }
    if (!user.isAdmin &&
        (params.fakeSubscribersAmount != null ||
            params.fakeBlockersAmount != null ||
            params.creationDate != null ||
            params.lastInteractionDate != null)) {
        ctx.throw(400, (0, i18n_tools_1.t)("Only admin users can set a fake information", { user }));
        return;
    }
    const validationResult = (0, tags_1.validateTagProps)(params);
    if (validationResult !== true) {
        ctx.throw(400, JSON.stringify(validationResult));
        return;
    }
    const tagsCreatedByUserTraversal = (0, queries_1.queryToGetTagsCreatedByUser)(user.token, configurations_1.TAG_CREATION_TIME_FRAME);
    const tagsCreatedByUser = await (0, data_conversion_1.fromQueryToTagList)(tagsCreatedByUserTraversal);
    if (tagsCreatedByUser.length >= configurations_1.TAGS_PER_TIME_FRAME && !user.isAdmin) {
        const remaining = moment
            .duration(getRemainingTimeToCreateNewTag(tagsCreatedByUser), "seconds")
            .locale(user.language)
            .humanize();
        ctx.throw(400, (0, i18n_tools_1.t)("Sorry you created too many tags", { user }, remaining));
        return;
    }
    const userTagsTraversal = (0, queries_1.queryToGetTags)({ languageFilter: (0, i18n_tools_1.findLocaleIn)({ user, ctx }) });
    const userTags = await (0, data_conversion_1.fromQueryToTagList)(userTagsTraversal);
    const matchingTag = userTags.find(tag => tag.name.toLowerCase() === params.name.toLowerCase());
    if (matchingTag != null) {
        ctx.throw(400, (0, i18n_tools_1.t)("A tag with the same name already exists", { user }));
        return;
    }
    const tagToCreate = {
        tagId: (0, string_tools_1.generateId)(),
        name: params.name,
        category: params.category.toLowerCase(),
        language: (_a = params.language) !== null && _a !== void 0 ? _a : (0, i18n_tools_1.findLocaleIn)({ user, ctx }),
        creationDate: (_b = params.creationDate) !== null && _b !== void 0 ? _b : moment().unix(),
        lastInteractionDate: (_c = params.lastInteractionDate) !== null && _c !== void 0 ? _c : moment().unix(),
        global: (_d = params.global) !== null && _d !== void 0 ? _d : false,
        subscribersAmount: (_e = params.fakeSubscribersAmount) !== null && _e !== void 0 ? _e : 0,
        blockersAmount: (_f = params.fakeBlockersAmount) !== null && _f !== void 0 ? _f : 0,
    };
    /*
     * Banned or unwanted users cannot create tags but since it's a shadow ban we don't return an error, we
     * return the tag object instead, like if it was created successfully but we are not calling
     * the database query
     */
    if (user.banReasonsAmount > 0 || user.unwantedUser) {
        return tagToCreate;
    }
    return await (0, data_conversion_1.fromQueryToTag)((0, queries_1.queryToCreateTags)(user.userId, [tagToCreate]));
}
exports.createTagPost = createTagPost;
async function tagsGet(params, ctx) {
    const user = await (0, models_1.retrieveUser)(params.token, false, ctx);
    const language = (0, i18n_tools_1.findLocaleIn)({ user, ctx });
    if (!language) {
        ctx.throw(400, "Reading tags and language not found, please report this error", { user });
        return;
    }
    let result;
    result = await (0, data_conversion_1.fromQueryToTagList)((0, queries_1.queryToGetTags)({ languageFilter: (0, i18n_tools_1.findLocaleIn)({ user, ctx }) }));
    result = translateAppAuthoredTags(result, { user });
    return result;
}
exports.tagsGet = tagsGet;
function appAuthoredTagsAsQuestionsGet(params, ctx) {
    return translateAppAuthoredTagsAsQuestions(configurations_1.APP_AUTHORED_TAGS_AS_QUESTIONS, ctx);
}
exports.appAuthoredTagsAsQuestionsGet = appAuthoredTagsAsQuestionsGet;
async function tagsCreatedByUserGet(token) {
    return await (0, data_conversion_1.fromQueryToTagList)((0, queries_1.queryToGetTagsCreatedByUser)(token));
}
exports.tagsCreatedByUserGet = tagsCreatedByUserGet;
async function subscribeToTagsPost(params, ctx) {
    var _a, _b, _c, _d, _e;
    const maxSubscriptionsAllowed = configurations_1.MAX_TAG_SUBSCRIPTIONS_ALLOWED + configurations_1.APP_AUTHORED_TAGS.length + configurations_1.APP_AUTHORED_TAGS_AS_QUESTIONS.length;
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, true, ctx);
    // Max tags allowed should also sum the tags the user does not know he/she is subscribed to
    if (((_a = user.tagsSubscribed) === null || _a === void 0 ? void 0 : _a.length) >= maxSubscriptionsAllowed) {
        ctx.throw(400, (0, i18n_tools_1.t)("You can subscribe to a maximum of %s tags, tap on 'My tags' button and remove the subscriptions to tags that are less important for you", { user }, String(maxSubscriptionsAllowed)));
        return;
    }
    // If the tags to subscribe array is bigger than the amount of tags allowed, we change the length
    if (params.tagIds.length + ((_c = (_b = user.tagsSubscribed) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > maxSubscriptionsAllowed) {
        params.tagIds.length = maxSubscriptionsAllowed - ((_e = (_d = user.tagsSubscribed) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0);
    }
    const result = await (0, data_conversion_1.fromQueryToTagList)((0, queries_1.queryToRelateUserWithTag)({
        token: params.token,
        tagIds: params.tagIds,
        relation: "subscribed",
        remove: false,
        maxSubscriptionsAllowed,
    }));
    // Check if by subscribing to the tags the user becomes unwanted
    const unwantedUser = (0, models_1.isUnwantedUser)({ tagsIdsToCheck: params.tagIds });
    if (unwantedUser) {
        await (0, models_1.userPost)({ token: params.token, props: { unwantedUser } }, ctx);
    }
    return result;
}
exports.subscribeToTagsPost = subscribeToTagsPost;
async function blockTagsPost(params) {
    return await (0, data_conversion_1.fromQueryToTagList)((0, queries_1.queryToRelateUserWithTag)({
        token: params.token,
        tagIds: params.tagIds,
        relation: "blocked",
        remove: false,
    }));
}
exports.blockTagsPost = blockTagsPost;
async function removeSubscriptionToTagsPost(params) {
    return await (0, data_conversion_1.fromQueryToTagList)((0, queries_1.queryToRelateUserWithTag)({
        token: params.token,
        tagIds: params.tagIds,
        relation: "subscribed",
        remove: true,
    }));
}
exports.removeSubscriptionToTagsPost = removeSubscriptionToTagsPost;
async function removeBlockToTagsPost(params) {
    return await (0, data_conversion_1.fromQueryToTagList)((0, queries_1.queryToRelateUserWithTag)({
        token: params.token,
        tagIds: params.tagIds,
        relation: "blocked",
        remove: true,
    }));
}
exports.removeBlockToTagsPost = removeBlockToTagsPost;
async function removeTagsPost(params, ctx) {
    const user = await (0, models_1.retrieveFullyRegisteredUser)(params.token, false, ctx);
    if (!user.isAdmin) {
        const tagsCreatedByUser = await tagsCreatedByUserGet(params.token);
        for (const tag of params.tagIds) {
            const tagFound = tagsCreatedByUser.find(ut => ut.tagId === tag);
            if (tagFound == null) {
                ctx.throw(400, (0, i18n_tools_1.t)("Only admin users can remove tags created by anyone", { user }));
                return;
            }
            if (tagFound.subscribersAmount > 0 || tagFound.blockersAmount > 0) {
                ctx.throw(400, (0, i18n_tools_1.t)("Sorry, %s users have interacted with your tag, it cannot be removed anymore", { user }, String(tagFound.subscribersAmount + tagFound.blockersAmount)));
                return;
            }
        }
    }
    await (0, queries_1.queryToRemoveTags)(params.tagIds).iterate();
}
exports.removeTagsPost = removeTagsPost;
async function createAppAuthoredTags() {
    // Create raw app authored tags
    const tagsToCreate = configurations_1.APP_AUTHORED_TAGS.map(tag => ({
        ...tag,
        language: "all",
        creationDate: moment().unix(),
        lastInteractionDate: moment().unix(),
        global: true,
        visible: true,
    }));
    // Crete app authored tags that are saved as questions
    tagsToCreate.push(...configurations_1.APP_AUTHORED_TAGS_AS_QUESTIONS.map(question => question.answers.map(answer => {
        var _a;
        return ({
            tagId: answer.tagId,
            category: answer.category,
            name: answer.tagName,
            visible: (_a = answer.tagIsVisible) !== null && _a !== void 0 ? _a : true,
            language: "all",
            creationDate: moment().unix(),
            lastInteractionDate: moment().unix(),
            global: true,
        });
    })).flat());
    await (0, data_conversion_1.fromQueryToTag)((0, common_queries_1.queryToCreateVerticesFromObjects)({
        objects: tagsToCreate,
        label: "tag",
        duplicationAvoidanceProperty: "tagId",
    }));
}
exports.createAppAuthoredTags = createAppAuthoredTags;
/**
 * This is currently being used to clean tests only
 */
async function removeAllTagsCreatedBy(users) {
    const result = [];
    for (const user of users) {
        result.push(...(await tagsCreatedByUserGet(user.token)));
    }
    await (0, queries_1.queryToRemoveTags)(result.map(tag => tag.tagId)).iterate();
}
exports.removeAllTagsCreatedBy = removeAllTagsCreatedBy;
function getNotShowedQuestionIds(user) {
    const result = [];
    configurations_1.APP_AUTHORED_TAGS_AS_QUESTIONS.forEach(tagQ => {
        var _a;
        const foundInUser = (_a = user.questionsShowed) === null || _a === void 0 ? void 0 : _a.find(q => q === tagQ.questionId);
        if (foundInUser == null) {
            result.push(tagQ.questionId);
        }
    });
    return result;
}
exports.getNotShowedQuestionIds = getNotShowedQuestionIds;
function getRemainingTimeToCreateNewTag(tags) {
    const oldestTag = tags.reduce((result, tag) => {
        // Tag is not inside the creation time frame
        if (tag.creationDate < moment().unix() - configurations_1.TAG_CREATION_TIME_FRAME) {
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
    let secondsLeft = 0;
    if (oldestTag != null) {
        secondsLeft = configurations_1.TAG_CREATION_TIME_FRAME - (moment().unix() - oldestTag.creationDate);
    }
    return secondsLeft;
}
/**
 * App authored tags are global, this means any language will see the tags, so translation is needed.
 */
function translateAppAuthoredTags(tags, localeSource) {
    const appAuthoredIds = getAppAuthoredQuestionsIdsAsSet();
    return tags.map(tag => {
        if (!appAuthoredIds.has(tag.tagId)) {
            return tag;
        }
        return {
            ...tag,
            category: (0, i18n_tools_1.t)(tag.category, localeSource),
            name: (0, i18n_tools_1.t)(tag.name, localeSource),
        };
    });
}
function translateAppAuthoredTagsAsQuestions(rawQuestions, ctx) {
    return rawQuestions.map(q => ({
        ...q,
        text: (0, i18n_tools_1.t)(q.text, { ctx }),
        extraText: q.extraText != null ? (0, i18n_tools_1.t)(q.extraText, { ctx }) : null,
        answers: q.answers.map(a => ({
            ...a,
            text: (0, i18n_tools_1.t)(a.text, { ctx }),
            category: (0, i18n_tools_1.t)(a.category, { ctx }),
            tagName: a.tagName != null ? (0, i18n_tools_1.t)(a.tagName, { ctx }) : null,
        })),
    }));
}
let catchedAppAuthoredQuestions = null;
function getAppAuthoredQuestionsIdsAsSet() {
    if (catchedAppAuthoredQuestions == null) {
        const result = new Set();
        configurations_1.APP_AUTHORED_TAGS.forEach(q => result.add(q.tagId));
        configurations_1.APP_AUTHORED_TAGS_AS_QUESTIONS.forEach(q => q.answers.forEach(a => result.add(a.tagId)));
        catchedAppAuthoredQuestions = result;
    }
    return catchedAppAuthoredQuestions;
}
exports.getAppAuthoredQuestionsIdsAsSet = getAppAuthoredQuestionsIdsAsSet;
//# sourceMappingURL=models.js.map