import * as moment from 'moment';
import ora = require('ora');
import { serializeIfNeeded } from '../../common-tools/database-tools/data-conversion-tools';
import { __, g } from '../../common-tools/database-tools/database-manager';
import { Traversal, GremlinValueType } from '../../common-tools/database-tools/gremlin-typing-tools';
import { setAttractionPost, userPost } from '../../components/user/models';
import { queryToCreateUser } from '../../components/user/queries';
import { getIncompatibleAnswers, questions as questionsData } from '../../components/user/questions/models';
import { fromQueryToUser, fromQueryToUserList } from '../../components/user/tools/data-conversion';
import {
   Attraction,
   AttractionType,
   Gender,
   QuestionResponse,
   User,
   UserPostParams,
} from '../../shared-tools/endpoints-interfaces/user';
import { EditableUserProps } from '../../shared-tools/validators/user';
import { chance } from './generalTools';
import { fakeCtx } from './replacements';

const fakeUsersCreated: User[] = [];

export async function createFakeUsers(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const users: User[] = [];
   const finalParams = { ...customParams };

   // userId and token should be null here otherwise instead of creating each user it will replace the first one
   delete finalParams?.userId;
   delete finalParams?.token;

   for (let i = 0; i < amount; i++) {
      users.push(await createFakeUser(finalParams));
   }

   return users;
}

// TODO: Crear una funcion para contestar preguntas masivamente
// TODO: Crear una funcion para establecer matches masivamente
// TODO: Crear variables globales que guardan los usuarios fake credos y los grupos fake creados
// para poder borrarlos sin tener que hacer variables en los tests
export async function createFakeUsersFast(amount: number, customParams?: Partial<User>): Promise<User[]> {
   const users: User[] = [];

   for (let i = 0; i < amount; i++) {
      users.push(generateRandomUserProps(customParams));
   }
   fakeUsersCreated.push(...users);

   return await fromQueryToUserList(queryToCreateManyUsersAtOnce(users), false);
}

export async function createFakeUser(customParams?: Partial<User>): Promise<User> {
   const props: User = generateRandomUserProps(customParams);

   let customParamsQuestions: QuestionResponse[] = [];
   if (customParams?.questions != null) {
      customParamsQuestions = customParams.questions.map(q => ({
         ...q,
         incompatibleAnswers: getIncompatibleAnswers(q.questionId, q.answerId) ?? [],
      }));
   }

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

   // The user object from this line contains the userId and other props added by the query to create the user.
   let user: Partial<User> = await fromQueryToUser(
      queryToCreateUser(props.token, props.email, true, props.userId),
      true,
   );

   await userPost({ token: props.token, props: props as EditableUserProps, questions }, fakeCtx);
   user = { ...user, ...(props as User), questions, profileCompleted: true };

   fakeUsersCreated.push(user as User);

   return user as User;
}

export function generateRandomUserProps(customParams?: Partial<User>): User {
   const genderLikes = chance.pickset([true, chance.bool(), chance.bool(), chance.bool(), chance.bool()], 5);

   const randomProps: User = {
      name: chance.first({ nationality: 'it' }),
      token: chance.apple_token(),
      userId: chance.apple_token(),
      email: chance.email(),
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
      notifications: [],
      lastLoginDate: moment().unix(),
      profileCompleted: true,
      lastGroupJoinedDate: moment().unix(),
   };

   return { ...randomProps, ...(customParams ?? {}) };
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

export async function createFakeCompatibleUsers(user: User, amount: number): Promise<User[]> {
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
      questions: user.questions,
   };
   const props = generateRandomUserProps(compatibleProps);

   return createFakeUsers(amount, props);
}

export function getAllFakeUsersCreated(): User[] {
   return fakeUsersCreated;
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

function queryToCreateManyUsersAtOnce(usersData: Array<Partial<User>>): Traversal {
   const propsReadyForDB: Partial<Record<keyof User, GremlinValueType>> = {};

   usersData.forEach(userData => {
      Object.keys(userData).forEach(key => {
         propsReadyForDB[key] = serializeIfNeeded(userData[key]);
      });
   });

   delete propsReadyForDB.questions;

   let propsT: Traversal = __.addV('user');
   Object.keys(propsReadyForDB[0]).forEach(d => (propsT = propsT.property(d, __.select(d))));

   return g
      .inject(propsReadyForDB)
      .unfold()
      .map(__.coalesce(__.V().has('user', 'token', __.select('token')), propsT));
}
