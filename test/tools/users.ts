import * as Chance from 'chance';
import { retreiveUser } from '../../src/components/common/models';
import { createUser } from '../../src/components/common/queries';
import { profileStatusGet, userPropsPost } from '../../src/components/user/models';
import { questions, respondQuestionPost } from '../../src/components/user/questions/models';
import { Gender, User } from '../../src/shared-tools/endpoints-interfaces/user';
import { ExposedUserProps } from '../../src/shared-tools/validators/user';

export async function createFakeUsers(ammount: number, seed: number): Promise<Array<Partial<User>>> {
   const users: Array<Partial<User>> = [];

   for (let i = 0; i < ammount; i++) {
      users.push(await createFakeUser(seed + i));
   }

   console.log(`Created ${users.length} fake users.`);

   return users;
}

let fakeUsersCount = 0;

export async function createFakeUser(seed: number): Promise<Partial<User>> {
   const chance = new Chance(seed);

   const genderLikes = chance.pickset([true, chance.bool(), chance.bool(), chance.bool(), chance.bool()], 5);
   const token: string = chance.apple_token();

   const props: ExposedUserProps = {
      name: chance.first({ nationality: 'it' }),
      age: chance.integer({ min: 18, max: 55 }),
      targetAgeMin: chance.integer({ min: 18, max: 20 }),
      targetAgeMax: chance.integer({ min: 30, max: 55 }),
      pictures: [
         'https://data.whicdn.com/images/75413003/large.jpg',
         'https://i.pinimg.com/originals/f9/dc/16/f9dc1608b6b94b29ed9070ac54b9e3b8.jpg',
         'https://files.lafm.com.co/assets/public/styles/image_631x369/public/2018-06/johnny_depp_0.jpg?itok=huih3ntS',
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

   await createUser(token, chance.email());
   await userPropsPost({ token, props }, null);
   for (const question of questions) {
      await respondQuestionPost({
         token,
         questionId: question.questionId,
         answerId: chance.pickone(question.answers).answerId,
         useAsFilter: chance.bool(),
      });
   }
   await profileStatusGet({ token }, null);
   const user: Partial<User> = await retreiveUser(token, null);

   fakeUsersCount++;

   return user;
}
