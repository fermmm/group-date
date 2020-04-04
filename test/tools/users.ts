import * as Chance from 'chance';
import ora = require('ora');
import { retreiveUser } from '../../src/components/common/models';
import { createUser } from '../../src/components/common/queries';
import { profileStatusGet, setAttractionPost, userPost } from '../../src/components/user/models';
import { questions } from '../../src/components/user/questions/models';
import {
   Attraction,
   AttractionType,
   Gender,
   QestionResponseParams,
   User,
   UserPostParams,
} from '../../src/shared-tools/endpoints-interfaces/user';
import { ExposedUserProps } from '../../src/shared-tools/validators/user';
import { fakeCtx } from './replacements';

const spinner: ora.Ora = ora({ text: 'Creating fake users...', spinner: 'noise' });

export async function createFakeUsers(ammount: number, seed?: number): Promise<User[]> {
   const users: User[] = [];

   spinner.start();

   for (let i = 0; i < ammount; i++) {
      users.push(await createFakeUser(null, seed + i));
      spinner.text = `Created ${fakeUsersCount} fake users...`;
   }

   spinner.succeed(`Created ${users.length} fake users.`);

   return users;
}

let fakeUsersCount = 0;

export async function createFakeUser(
   customParams: Partial<UserPostParams> = null,
   seed?: number,
): Promise<User> {
   const chance = new Chance(seed || fakeUsersCount);

   const genderLikes = chance.pickset([true, chance.bool(), chance.bool(), chance.bool(), chance.bool()], 5);
   const token: string = customParams?.token || chance.apple_token();

   const props: ExposedUserProps = {
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
      locationLat: chance.latitude({ min: -38.88147, max: -32.990726 }),
      locationLon: chance.longitude({ min: -63.346051, max: -56.729749 }),
      likesWoman: genderLikes[0],
      likesMan: genderLikes[1],
      likesWomanTrans: genderLikes[2],
      likesManTrans: genderLikes[3],
      likesOtherGenders: genderLikes[4],
      gender: chance.pickone(Object.values(Gender)),
      height: chance.integer({ min: 100, max: 300 }),
   };

   const questionResponses: QestionResponseParams[] = questions.map(question => {
      return {
         questionId: question.questionId,
         answerId: chance.pickone(question.answers).answerId,
         useAsFilter: chance.bool(),
      };
   });

   await createUser(token, chance.email());
   await userPost(
      {
         token,
         props: { ...props, ...customParams?.props },
         questions: [...questionResponses, ...(customParams?.questions || [])],
      },
      fakeCtx,
   );
   await profileStatusGet({ token }, fakeCtx);
   const user: Partial<User> = await retreiveUser(token, fakeCtx);

   fakeUsersCount++;

   return user as User;
}

export async function setFakeAttraction(from: User, to: User[], attractionType: AttractionType): Promise<void> {
   const attractions: Attraction[] = to.map(user => ({ userId: user.userId, attractionType }));
   await setAttractionPost(
      {
         token: from.token,
         attractions,
      },
      fakeCtx,
   );
}

export async function setFakeAttractionMatch(users: User[]): Promise<void> {
   for (const user of users) {
      await setFakeAttraction(user, users, AttractionType.Like);
   }
}
