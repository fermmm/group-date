import * as moment from "moment";
import { fromAgeToBirthDate, fromBirthDateToAge } from "./../../common-tools/math-tools/date-tools";
import { createUser, setAttractionPost, userPost } from "../../components/user/models";
import { Attraction, AttractionType, Gender, User } from "../../shared-tools/endpoints-interfaces/user";
import { EditableUserProps } from "../../shared-tools/validators/user";
import { chance } from "./generalTools";
import { fakeCtx } from "./replacements";
import { generateId } from "../../common-tools/string-tools/string-tools";
import { getAllTestUsersCreatedExperimental } from "./_experimental";
import { APP_AUTHORED_TAGS_AS_QUESTIONS, DEFAULT_LANGUAGE } from "../../configurations";
import { DeepPartial } from "ts-essentials";

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

export async function createFakeUser(customProps?: Partial<User>): Promise<User> {
   const userProps: User = generateRandomUserProps(customProps);

   await createUser(userProps.token, userProps.email, false, fakeCtx, true, userProps.userId);
   await userPost({ token: userProps.token, props: userProps as EditableUserProps }, fakeCtx);

   fakeUsersCreated.push(userProps);
   return userProps;
}

export async function createMultipleFakeCustomUsers(customProps: Array<DeepPartial<User>>): Promise<User[]> {
   const result: User[] = [];
   for (const data of customProps) {
      result.push(await createFakeUser(data as User));
   }
   return result;
}

/**
 * @param customProps Provide user props that should not be random here.
 */
export function generateRandomUserProps(customProps?: Partial<User>): User {
   const randomProps: User = {
      name: chance.first({
         nationality: "it",
         gender: chance.bool() ? "female" : "male",
      }),
      cityName: chance.city(),
      language: DEFAULT_LANGUAGE,
      isCoupleProfile: chance.bool(),
      country: chance.country(),
      token: generateId(),
      userId: generateId(),
      email: chance.email(),
      birthDate: chance.integer({ max: fromAgeToBirthDate(18), min: fromAgeToBirthDate(55) }),
      targetAgeMin: chance.integer({ min: 18, max: 20 }),
      targetAgeMax: chance.integer({ min: 30, max: 55 }),
      targetDistance: chance.integer({ min: 25, max: 150 }),
      images: [getRandomFakeImage()],
      dateIdea: chance.sentence({ words: 5 }),
      profileDescription: chance.paragraph(),
      locationLat: chance.latitude({ min: -38.88147, max: -32.990726 }),
      locationLon: chance.longitude({ min: -63.346051, max: -56.729749 }),
      height: chance.integer({ min: 160, max: 190 }),
      sendNewUsersNotification: 0,
      notifications: [],
      lastLoginDate: moment().unix(),
      profileCompleted: true,
      lastGroupJoinedDate: moment().unix(),
      questionsShowed: APP_AUTHORED_TAGS_AS_QUESTIONS.map(q => q.questionId),
      targetGenderIsSelected: true,
      notificationsToken: generateId(),
   };

   return { ...randomProps, ...(customProps ?? {}) };
}

let remainingImages: number[] = [];
export function getRandomFakeImage(): string {
   const fakeImagesAmount = 40;
   if (remainingImages.length === 0) {
      remainingImages = chance.unique(
         () => chance.integer({ min: 1, max: fakeImagesAmount }),
         fakeImagesAmount,
      );
   }
   return "fake/" + String(remainingImages.splice(0, 1)[0]).padStart(2, "0") + "_big.jpg";
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
   const result: User[] = [];
   for (let i = 0; i < amount; i++) {
      const compatibleProps: Partial<User> = {
         birthDate: chance.integer({
            max: fromAgeToBirthDate(user.targetAgeMin),
            min: fromAgeToBirthDate(user.targetAgeMax),
         }),
         targetAgeMin: 18,
         targetAgeMax: chance.integer({
            min: fromBirthDateToAge(user.birthDate),
            max: fromBirthDateToAge(user.birthDate) + 5,
         }),
         targetDistance: 25,
         locationLat: user.locationLat,
         locationLon: user.locationLon,
      };
      result.push(await createFakeUser({ ...compatibleProps, ...(customProps ?? {}) }));
   }
   return result;
}

export function getAllTestUsersCreated(): User[] {
   const result = [...fakeUsersCreated, ...getAllTestUsersCreatedExperimental()];
   fakeUsersCreated = [];
   return result;
}
