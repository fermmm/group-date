import * as Chance from 'chance';
import * as moment from 'moment';
import ora = require('ora');
import { queryToUser } from '../../src/common-tools/database-tools/data-conversion-tools';
import { setAttractionPost, userPost } from '../../src/components/user/models';
import { queryToCreateUser } from '../../src/components/user/queries';
import { getIncompatibleAnswers, questions as questionsData } from '../../src/components/user/questions/models';
import {
   Attraction,
   AttractionType,
   Gender,
   QuestionResponse,
   User,
   UserPostParams,
} from '../../src/shared-tools/endpoints-interfaces/user';
import { ExposedUserProps } from '../../src/shared-tools/validators/user';
import { fakeCtx } from './replacements';

const spinner: ora.Ora = ora({ text: 'Creating fake users...', spinner: 'noise' });

export async function createFakeUsers(
   amount: number,
   customParams?: Partial<UserPostParams>,
   seed?: number,
): Promise<User[]> {
   const users: User[] = [];

   spinner.start();

   for (let i = 0; i < amount; i++) {
      users.push(await createFakeUser(customParams, seed + i));
      spinner.text = `Created ${fakeUsersCount} fake users...`;
   }

   spinner.succeed(`Created ${users.length} fake users.`);

   return users;
}

let fakeUsersCount = 0;

export async function createFakeUser(customParams?: Partial<UserPostParams>, seed?: number): Promise<User> {
   const chance = new Chance(seed || fakeUsersCount);

   const genderLikes = chance.pickset([true, chance.bool(), chance.bool(), chance.bool(), chance.bool()], 5);
   const token: string = customParams?.token || chance.apple_token();

   const randomProps: ExposedUserProps = {
      name: chance.first({ nationality: 'it' }),
      age: chance.integer({ min: 18, max: 55 }),
      targetAgeMin: chance.integer({ min: 18, max: 20 }),
      targetAgeMax: chance.integer({ min: 30, max: 55 }),
      targetDistance: chance.integer({ min: 25, max: 150 }),
      pictures: [
         'https://data.whicdn.com/images/75413003/large.jpg',
         'https://i.pinimg.com/originals/f9/dc/16/f9dc1608b6b94b29ed9070ac54b9e3b8.jpg',
      ],
      dateIdeaName: chance.sentence({ words: 5 }),
      dateIdeaAddress: chance.address(),
      profileDescription: chance.paragraph(),
      locationName: chance.city(),
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
   };

   let customParamsQuestions: QuestionResponse[] = [];
   if (customParams?.questions != null) {
      customParamsQuestions = customParams.questions.map(q => ({
         ...q,
         incompatibleAnswers: getIncompatibleAnswers(q.questionId, q.answerId) ?? [],
      }));
   }

   const props = { ...randomProps, ...customParams?.props };
   const questions: QuestionResponse[] = questionsData.map(question => {
      const questionFoundOnParams = customParamsQuestions.find(q => q.questionId === question.questionId);
      if (questionFoundOnParams) {
         return questionFoundOnParams;
      }

      const answer = chance.pickone(question.answers).answerId;

      return {
         questionId: question.questionId,
         answerId: answer,
         useAsFilter: chance.bool(),
         incompatibleAnswers: getIncompatibleAnswers(question.questionId, answer) ?? [],
      };
   });

   let user: Partial<User> = await queryToUser(queryToCreateUser(token, chance.email(), true), true);
   await userPost({ token, props, questions }, fakeCtx);

   // await profileStatusGet({ token }, fakeCtx);
   // user = await retrieveUser(token, true, fakeCtx);
   // This replaces profileStatusGet and retrieveUser. It's faster but if there is any problem can be replaced by the commented lines on top
   user = { ...user, ...(props as User), questions, profileCompleted: true, lastLoginDate: moment().unix() };

   fakeUsersCount++;

   return user as User;
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

export async function createFakeCompatibleUsers(user: User, amount: number, seed?: number): Promise<User[]> {
   const chance = new Chance(seed || fakeUsersCount);

   const compatibleRandomProps: Partial<UserPostParams> = {
      props: {
         age: chance.integer({ min: user.targetAgeMin, max: user.targetAgeMax }),
         targetAgeMin: chance.integer({ min: user.age - 5, max: user.age }),
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
      },
      questions: user.questions,
   };

   return createFakeUsers(amount, compatibleRandomProps, seed);
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
