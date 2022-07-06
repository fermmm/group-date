"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnswerThatChangesProp = exports.getAllTestUsersCreated = exports.getEdgeLabelsBetweenUsers = exports.createFakeCompatibleUsers = exports.setAttractionAllWithAll = exports.setAttractionMatch = exports.setAttraction = exports.getRandomFakeImage = exports.generateRandomQuestionResponses = exports.generateRandomUserProps = exports.createMultipleFakeCustomUsers = exports.createFakeUser = exports.createFakeUsers = void 0;
const moment = require("moment");
const date_tools_1 = require("./../../common-tools/math-tools/date-tools");
const models_1 = require("../../components/user/models");
const user_1 = require("../../shared-tools/endpoints-interfaces/user");
const generalTools_1 = require("./generalTools");
const replacements_1 = require("./replacements");
const string_tools_1 = require("../../common-tools/string-tools/string-tools");
const _experimental_1 = require("./_experimental");
const configurations_1 = require("../../configurations");
const models_2 = require("../../components/admin/models");
const database_manager_1 = require("../../common-tools/database-tools/database-manager");
const queries_1 = require("../../components/user/queries");
let fakeUsersCreated = [];
async function createFakeUsers(amount, customParams) {
    const users = [];
    const finalParams = { ...customParams };
    if (amount > 1) {
        // userId, token and email should be null here otherwise instead of creating each user it will replace the first one
        finalParams === null || finalParams === void 0 ? true : delete finalParams.userId;
        finalParams === null || finalParams === void 0 ? true : delete finalParams.token;
        finalParams === null || finalParams === void 0 ? true : delete finalParams.email;
    }
    for (let i = 0; i < amount; i++) {
        users.push(await createFakeUser(finalParams));
    }
    return users;
}
exports.createFakeUsers = createFakeUsers;
async function createFakeUser(customProps, options) {
    var _a;
    const { makeItAdmin, withRandomQuestionResponses, simulateProfileComplete = true } = options || {};
    const questionAnswers = [
        ...((_a = customProps === null || customProps === void 0 ? void 0 : customProps.questionsResponded) !== null && _a !== void 0 ? _a : []),
        ...(withRandomQuestionResponses ? generateRandomQuestionResponses() : []),
    ];
    if ((customProps === null || customProps === void 0 ? void 0 : customProps.isCoupleProfile) != null) {
        questionAnswers.push(getAnswerThatChangesProp("isCoupleProfile", customProps.isCoupleProfile));
    }
    const userProps = generateRandomUserProps(customProps);
    await (0, models_1.createUser)({
        token: userProps.token,
        email: userProps.email,
        includeFullInfo: false,
        ctx: replacements_1.fakeCtx,
        setProfileCompletedForTesting: simulateProfileComplete,
        customUserIdForTesting: userProps.userId,
    });
    await (0, models_1.userPost)({ token: userProps.token, props: userProps, questionAnswers }, replacements_1.fakeCtx);
    if (makeItAdmin) {
        await (0, models_2.convertToAdmin)(userProps.token);
    }
    fakeUsersCreated.push(userProps);
    return userProps;
}
exports.createFakeUser = createFakeUser;
async function createMultipleFakeCustomUsers(customProps) {
    const result = [];
    for (const data of customProps) {
        result.push(await createFakeUser(data));
    }
    return result;
}
exports.createMultipleFakeCustomUsers = createMultipleFakeCustomUsers;
/**
 * @param customProps Provide user props that should not be random here.
 * @param customProps Default = false. Also include random question responses
 */
function generateRandomUserProps(customProps) {
    const randomProps = {
        name: generalTools_1.chance.first({
            nationality: "it",
            gender: generalTools_1.chance.bool() ? "female" : "male",
        }),
        cityName: generalTools_1.chance.city(),
        language: configurations_1.DEFAULT_LANGUAGE,
        genders: [generalTools_1.chance.pickone([...user_1.CIS_GENDERS])],
        likesGenders: [
            generalTools_1.chance.pickone([...user_1.CIS_GENDERS]),
            ...generalTools_1.chance.pickset([...user_1.NON_CIS_GENDERS], generalTools_1.chance.integer({ min: 0, max: user_1.NON_CIS_GENDERS.length })),
        ],
        country: generalTools_1.chance.country(),
        token: (0, string_tools_1.generateId)(),
        userId: (0, string_tools_1.generateId)(),
        email: generalTools_1.chance.email(),
        birthDate: generalTools_1.chance.integer({ max: (0, date_tools_1.fromAgeToBirthDate)(18), min: (0, date_tools_1.fromAgeToBirthDate)(55) }),
        targetAgeMin: generalTools_1.chance.integer({ min: 18, max: 20 }),
        targetAgeMax: generalTools_1.chance.integer({ min: 30, max: 55 }),
        targetDistance: generalTools_1.chance.integer({ min: 25, max: 150 }),
        images: [getRandomFakeImage()],
        dateIdea: generalTools_1.chance.sentence({ words: 5 }),
        profileDescription: generalTools_1.chance.paragraph(),
        locationLat: generalTools_1.chance.latitude({ min: -38.88147, max: -32.990726 }),
        locationLon: generalTools_1.chance.longitude({ min: -63.346051, max: -56.729749 }),
        height: generalTools_1.chance.integer({ min: 160, max: 190 }),
        sendNewUsersNotification: 0,
        notifications: [],
        lastLoginDate: moment().unix(),
        profileCompleted: true,
        lastGroupJoinedDate: moment().unix(),
        notificationsToken: (0, string_tools_1.generateId)(),
    };
    return { ...randomProps, ...(customProps !== null && customProps !== void 0 ? customProps : {}) };
}
exports.generateRandomUserProps = generateRandomUserProps;
function generateRandomQuestionResponses() {
    return configurations_1.QUESTIONS.map(q => ({
        questionId: q.questionId,
        answerId: generalTools_1.chance.pickone([...q.answers]).answerId,
    }));
}
exports.generateRandomQuestionResponses = generateRandomQuestionResponses;
let remainingImages = [];
function getRandomFakeImage() {
    const fakeImagesAmount = 40;
    if (remainingImages.length === 0) {
        remainingImages = generalTools_1.chance.unique(() => generalTools_1.chance.integer({ min: 1, max: fakeImagesAmount }), fakeImagesAmount);
    }
    return "fake/" + String(remainingImages.splice(0, 1)[0]).padStart(2, "0") + "_big.jpg";
}
exports.getRandomFakeImage = getRandomFakeImage;
async function setAttraction(from, to, attractionType) {
    const attractions = to.map(user => ({ userId: user.userId, attractionType }));
    await (0, models_1.setAttractionPost)({
        token: from.token,
        attractions,
    }, replacements_1.fakeCtx);
}
exports.setAttraction = setAttraction;
async function setAttractionMatch(user, targetUsers) {
    for (const targetUser of targetUsers) {
        await setAttraction(user, [targetUser], user_1.AttractionType.Like);
        await setAttraction(targetUser, [user], user_1.AttractionType.Like);
    }
}
exports.setAttractionMatch = setAttractionMatch;
async function setAttractionAllWithAll(users) {
    for (const user of users) {
        await setAttraction(user, users, user_1.AttractionType.Like);
    }
}
exports.setAttractionAllWithAll = setAttractionAllWithAll;
async function createFakeCompatibleUsers(user, amount, customProps) {
    const result = [];
    for (let i = 0; i < amount; i++) {
        const compatibleProps = {
            birthDate: generalTools_1.chance.integer({
                max: (0, date_tools_1.fromAgeToBirthDate)(user.targetAgeMin),
                min: (0, date_tools_1.fromAgeToBirthDate)(user.targetAgeMax),
            }),
            targetAgeMin: 18,
            targetAgeMax: generalTools_1.chance.integer({
                min: (0, date_tools_1.fromBirthDateToAge)(user.birthDate),
                max: (0, date_tools_1.fromBirthDateToAge)(user.birthDate) + 5,
            }),
            genders: [...user.likesGenders],
            likesGenders: [...user.genders],
            targetDistance: 25,
            locationLat: user.locationLat,
            locationLon: user.locationLon,
        };
        result.push(await createFakeUser({ ...compatibleProps, ...(customProps !== null && customProps !== void 0 ? customProps : {}) }));
    }
    return result;
}
exports.createFakeCompatibleUsers = createFakeCompatibleUsers;
async function getEdgeLabelsBetweenUsers(userId1, userId2) {
    return (await (0, queries_1.queryToGetUserById)(userId1)
        .bothE()
        .where(database_manager_1.__.bothV().has("userId", userId2))
        .label()
        .toList());
}
exports.getEdgeLabelsBetweenUsers = getEdgeLabelsBetweenUsers;
function getAllTestUsersCreated() {
    const result = [...fakeUsersCreated, ...(0, _experimental_1.getAllTestUsersCreatedExperimental)()];
    fakeUsersCreated = [];
    return result;
}
exports.getAllTestUsersCreated = getAllTestUsersCreated;
function getAnswerThatChangesProp(propName, propValue) {
    const question = configurations_1.QUESTIONS.find(q => q.answers.find(a => { var _a; return ((_a = a.setsUserProp) === null || _a === void 0 ? void 0 : _a.find(p => p.propName === propName)) != null; }) != null);
    const answer = question === null || question === void 0 ? void 0 : question.answers.find(a => { var _a; return (_a = a.setsUserProp) === null || _a === void 0 ? void 0 : _a.find(p => p.propName === propName && p.valueToSet === propValue); });
    if (question == null || answer == null) {
        return null;
    }
    return { questionId: question.questionId, answerId: answer.answerId };
}
exports.getAnswerThatChangesProp = getAnswerThatChangesProp;
//# sourceMappingURL=users.js.map