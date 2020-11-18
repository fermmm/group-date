import * as moment from "moment";
import ora = require("ora");
import { sendQuery } from "../../common-tools/database-tools/database-manager";
import { setAttractionPost, userPost } from "../../components/user/models";
import { queryToCreateUser } from "../../components/user/queries";
import {
   Attraction,
   AttractionType,
   Gender,
   QuestionResponse,
   QuestionResponseParams,
   User,
} from "../../shared-tools/endpoints-interfaces/user";
import { EditableUserProps } from "../../shared-tools/validators/user";
import { chance } from "./generalTools";
import { fakeCtx } from "./replacements";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { getAllTestUsersCreatedExperimental } from "./_experimental";
import { APP_AUTHORED_THEMES_AS_QUESTIONS, DEFAULT_LANGUAGE } from "../../configurations";

let fakeUsersCreated: User[] = [];

export async function createFakeUsers(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const users: User[] = [];
   const finalParams = { ...customParams };

   if (amount > 1) {
      // userId, token and email should be null here otherwise instead of creating each user it will replace the first one
      delete finalParams?.userId;
      delete finalParams?.token;
      delete finalParams?.email;
   }

   for (let i = 0; i < amount; i++) {
      users.push(await createFakeUser(finalParams));
   }

   return users;
}

export async function createFakeUser(customParams?: Partial<User>): Promise<User> {
   const userProps: User = generateRandomUserProps(customParams);

   await sendQuery(() => queryToCreateUser(userProps.token, userProps.email, true, userProps.userId).iterate());
   await userPost({ token: userProps.token, props: userProps as EditableUserProps }, fakeCtx);

   fakeUsersCreated.push(userProps);
   return userProps;
}

/**
 * @param customProps Provide user props that should not be random here.
 */
export function generateRandomUserProps(customProps?: Partial<User>): User {
   const genderLikes = chance.pickset([true, chance.bool(), chance.bool(), chance.bool(), chance.bool()], 5);
   const randomProps: User = {
      name: chance.first({ nationality: "it" }),
      cityName: chance.city(),
      language: DEFAULT_LANGUAGE,
      isCoupleProfile: chance.bool(),
      country: chance.country(),
      token: generateId(),
      userId: generateId(),
      email: chance.email(),
      age: chance.integer({ min: 18, max: 55 }),
      targetAgeMin: chance.integer({ min: 18, max: 20 }),
      targetAgeMax: chance.integer({ min: 30, max: 55 }),
      targetDistance: chance.integer({ min: 25, max: 150 }),
      pictures: [
         "https://data.whicdn.com/images/75413003/large.jpg",
         "https://i.pinimg.com/originals/f9/dc/16/f9dc1608b6b94b29ed9070ac54b9e3b8.jpg",
      ],
      dateIdea: chance.sentence({ words: 5 }),
      profileDescription: chance.paragraph(),
      locationLat: chance.latitude({ min: -38.88147, max: -32.990726 }),
      locationLon: chance.longitude({ min: -63.346051, max: -56.729749 }),
      likesWoman: genderLikes[0],
      likesMan: genderLikes[1],
      likesWomanTrans: genderLikes[2],
      likesManTrans: genderLikes[3],
      likesOtherGenders: genderLikes[4],
      gender: chance.pickone(Object.values(Gender)),
      height: chance.integer({ min: 100, max: 300 }),
      sendNewUsersNotification: 0,
      notifications: [],
      lastLoginDate: moment().unix(),
      profileCompleted: true,
      lastGroupJoinedDate: moment().unix(),
      questionsShowed: APP_AUTHORED_THEMES_AS_QUESTIONS.map(q => q.questionId),
   };

   return { ...randomProps, ...(customProps ?? {}) };
}

export async function setAttraction(from: User, to: User[], attractionType: AttractionType): Promise<void> {
   const attractions: Attraction[] = to.map(user => ({ userId: user.userId, attractionType }));
   await setAttractionPost(
      {
         token: from.token,
         attractions,
      },
      fakeCtx,
   );
}

export async function setAttractionMatch(user: User, targetUsers: User[]): Promise<void> {
   for (const targetUser of targetUsers) {
      await setAttraction(user, [targetUser], AttractionType.Like);
      await setAttraction(targetUser, [user], AttractionType.Like);
   }
}

export async function setAttractionAllWithAll(users: User[]): Promise<void> {
   for (const user of users) {
      await setAttraction(user, users, AttractionType.Like);
   }
}

export async function createFakeCompatibleUsers(
   user: User,
   amount: number,
   customProps?: Partial<User>,
): Promise<User[]> {
   const compatibleProps = {
      age: chance.integer({ min: user.targetAgeMin, max: user.targetAgeMax }),
      targetAgeMin: 18,
      targetAgeMax: chance.integer({ min: user.age, max: user.age + 5 }),
      targetDistance: 25,
      locationLat: user.locationLat,
      locationLon: user.locationLon,
      likesWoman: true,
      likesMan: true,
      likesWomanTrans: true,
      likesManTrans: true,
      likesOtherGenders: true,
      gender: getGendersLikedByUser(user)[0],
   };
   const props = generateRandomUserProps({ ...compatibleProps, ...customProps });

   return createFakeUsers(amount, props);
}

export function getAllTestUsersCreated(): User[] {
   const result = [...fakeUsersCreated, ...getAllTestUsersCreatedExperimental()];
   fakeUsersCreated = [];
   return result;
}

function getGendersLikedByUser(user: User): Gender[] {
   const result: Gender[] = [];

   if (user.likesWoman) {
      result.push(Gender.Woman);
   }
   if (user.likesMan) {
      result.push(Gender.Man);
   }
   if (user.likesWomanTrans) {
      result.push(Gender.TransgenderWoman);
   }
   if (user.likesManTrans) {
      result.push(Gender.TransgenderMan);
   }
   if (user.likesOtherGenders) {
      result.push(Gender.Other);
   }

   return result;
}

export interface UserResponses {
   token: string;
   responses: QuestionResponseParams[];
}
