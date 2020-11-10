import 'jest';
import * as JestDateMock from 'jest-date-mock';
import {
   blockThemePost,
   createThemePost,
   removeAllThemesCreatedBy,
   removeBlockToThemePost,
   removeSubscriptionToThemePost,
   removeThemesPost,
   subscribeToThemePost,
   themesCreatedByUserGet,
   themesGet,
} from '../components/themes/models';
import { queryToRemoveUsers } from '../components/user/queries';
import {
   MAX_THEME_SUBSCRIPTIONS_ALLOWED,
   THEMES_PER_TIME_FRAME,
   THEME_CREATION_TIME_FRAME,
} from '../configurations';
import { User } from '../shared-tools/endpoints-interfaces/user';
import { fakeCtx, fakeCtxMuted } from './tools/replacements';
import { createFakeUser, getAllTestUsersCreated } from './tools/users';
import { hoursToMilliseconds } from '../common-tools/math-tools/general';
import { Theme } from '../shared-tools/endpoints-interfaces/themes';
import { retrieveFullyRegisteredUser } from '../components/user/models';
import { objectsContentIsEqual } from '../common-tools/js-tools/js-tools';
import { createFakeUser2 } from './tools/_experimental';

describe('Themes', () => {
   let user1: User;
   let user2: User;
   let userUnrelated: User;
   let user1Themes: Theme[];
   let user2Themes: Theme[];

   beforeAll(async () => {
      user1 = await createFakeUser({ country: 'ar' });
      user2 = await createFakeUser({ country: 'ar' });
      userUnrelated = await createFakeUser({ country: 'us' });
   });

   test('Themes can be created up to the maximum allowed and correctly retrieved by country', async () => {
      for (let i = 0; i < THEMES_PER_TIME_FRAME; i++) {
         await createThemePost(
            {
               token: userUnrelated.token,
               name: `unrelated user test theme ${i}`,
               category: 'test category 1',
            },
            fakeCtx,
         );

         await createThemePost(
            {
               token: user1.token,
               name: `user 1 test theme ${i}`,
               category: 'test category 2',
            },
            fakeCtx,
         );

         await createThemePost(
            {
               token: user2.token,
               name: `user 2 test theme ${i}`,
               category: 'test category 3',
            },
            fakeCtx,
         );
      }

      user1Themes = await themesGet({ token: user1.token }, fakeCtx);
      user2Themes = await themesGet({ token: user2.token }, fakeCtx);
      const unrelatedThemes = await themesGet({ token: userUnrelated.token }, fakeCtx);

      expect(user1Themes).toHaveLength(THEMES_PER_TIME_FRAME * 2);
      expect(user2Themes).toHaveLength(THEMES_PER_TIME_FRAME * 2);
      expect(unrelatedThemes).toHaveLength(THEMES_PER_TIME_FRAME);
   });
   test('Creating more themes than the maximum allowed per time frame should be not possible', async () => {
      await createThemePost(
         {
            token: user1.token,
            name: `test theme should not be created`,
            category: 'test category 2',
         },
         fakeCtxMuted,
      );

      user1Themes = await themesGet({ token: user1.token }, fakeCtx);
      expect(user1Themes).toHaveLength(THEMES_PER_TIME_FRAME * 2);
   });

   test('After full time frame passes it should be possible to add new themes', async () => {
      // Simulate time passing, not all required time
      JestDateMock.advanceBy((THEME_CREATION_TIME_FRAME * 1000) / 2);

      await createThemePost(
         {
            token: user1.token,
            name: `test theme should not be created`,
            category: 'test category 2',
         },
         fakeCtxMuted,
      );

      user1Themes = await themesGet({ token: user1.token }, fakeCtx);
      expect(user1Themes).toHaveLength(THEMES_PER_TIME_FRAME * 2);

      // Now enough time has passed
      JestDateMock.advanceBy((THEME_CREATION_TIME_FRAME * 1000) / 2 + hoursToMilliseconds(1));

      await createThemePost(
         {
            token: user1.token,
            name: `new test theme`,
            category: 'test category 2',
         },
         fakeCtx,
      );

      user1Themes = await themesGet({ token: user1.token }, fakeCtx);
      expect(user1Themes).toHaveLength(THEMES_PER_TIME_FRAME * 2 + 1);

      JestDateMock.clear();
   });

   test('Should not be possible to create 2 themes with the same name in the same country', async () => {
      const user = await createFakeUser({ country: 'ar' });
      const userOutside = await createFakeUser({ country: 'ch' });

      await createThemePost(
         {
            token: user.token,
            name: `new test theme`,
            category: 'test category 2',
         },
         fakeCtxMuted,
      );

      await createThemePost(
         {
            token: userOutside.token,
            name: `new test theme`,
            category: 'test category 2',
         },
         fakeCtx,
      );

      const userThemes = await themesGet({ token: user.token }, fakeCtx);
      expect(userThemes).toHaveLength(THEMES_PER_TIME_FRAME * 2 + 1);

      const userOutsideThemes = await themesGet({ token: userOutside.token }, fakeCtx);
      expect(userOutsideThemes).toHaveLength(1);
   });

   test('Subscribing and retrieving subscribed themes works', async () => {
      user1Themes = await themesGet({ token: user1.token }, fakeCtx);
      const themeIds: string[] = [user1Themes[0].themeId, user1Themes[1].themeId];
      await subscribeToThemePost({
         token: user1.token,
         themeIds,
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      user2 = await retrieveFullyRegisteredUser(user2.token, true, fakeCtx);

      expect(
         user1.themesSubscribed
            .map(t => t.themeId)
            .sort()
            .join(),
      ).toEqual(themeIds.sort().join());

      expect(user1.themesBlocked ?? []).toHaveLength(0);
      expect(user2.themesSubscribed ?? []).toHaveLength(0);
   });

   test('Removing subscription works', async () => {
      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      const originalSubscriptions = [...user1.themesSubscribed];

      await removeSubscriptionToThemePost({
         token: user1.token,
         themeIds: [originalSubscriptions[0].themeId],
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);

      expect(
         objectsContentIsEqual(
            user1.themesSubscribed.map(t => t.themeId),
            [originalSubscriptions[1].themeId],
         ),
      ).toBe(true);

      await subscribeToThemePost({
         token: user1.token,
         themeIds: [originalSubscriptions[0].themeId],
      });
      await subscribeToThemePost({
         token: user2.token,
         themeIds: [originalSubscriptions[0].themeId],
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);

      await removeSubscriptionToThemePost({
         token: user1.token,
         themeIds: user1.themesSubscribed.map(t => t.themeId),
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      user2 = await retrieveFullyRegisteredUser(user2.token, true, fakeCtx);

      expect(user1.themesSubscribed ?? []).toHaveLength(0);
      expect(user2.themesSubscribed).toHaveLength(1);
   });

   test('Adding and removing block works', async () => {
      user1Themes = await themesGet({ token: user1.token }, fakeCtx);
      const themeIds: string[] = [user1Themes[0].themeId];
      await blockThemePost({
         token: user1.token,
         themeIds,
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);
      user2 = await retrieveFullyRegisteredUser(user2.token, true, fakeCtx);

      expect(
         objectsContentIsEqual(
            themeIds,
            user1.themesBlocked.map(t => t.themeId),
         ),
      ).toBe(true);

      expect(user2.themesBlocked ?? []).toHaveLength(0);

      await removeBlockToThemePost({
         token: user1.token,
         themeIds,
      });

      user1 = await retrieveFullyRegisteredUser(user1.token, true, fakeCtx);

      expect(user1.themesBlocked ?? []).toHaveLength(0);
   });

   test('Removing theme is possible when it has no interactions and not possible when has', async () => {
      user1Themes = await themesCreatedByUserGet(user1.token);
      const themeIds: string[] = [user1Themes[0].themeId, user1Themes[1].themeId];

      await subscribeToThemePost({
         token: user2.token,
         themeIds: [themeIds[0]],
      });

      await blockThemePost({
         token: user2.token,
         themeIds: [themeIds[1]],
      });

      await removeThemesPost({ token: user1.token, themeIds: [themeIds[0]] }, fakeCtxMuted);

      expect(await themesCreatedByUserGet(user1.token)).toHaveLength(user1Themes.length);

      await removeSubscriptionToThemePost({
         token: user2.token,
         themeIds,
      });

      await removeBlockToThemePost({
         token: user2.token,
         themeIds,
      });

      await removeSubscriptionToThemePost({
         token: user1.token,
         themeIds,
      });

      await removeBlockToThemePost({
         token: user1.token,
         themeIds,
      });

      await removeThemesPost({ token: user1.token, themeIds }, fakeCtx);

      expect(await themesCreatedByUserGet(user1.token)).toHaveLength(user1Themes.length - themeIds.length);
   });

   test(`Subscribing to more themes than MAX_THEME_SUBSCRIPTIONS_ALLOWED is not possible for the same country`, async () => {
      let user = await createFakeUser({ country: 'ar' });
      const themes: Theme[] = [];

      // Create the maximum amount of themes for 'ar' country
      for (let i = 0; i < MAX_THEME_SUBSCRIPTIONS_ALLOWED; i++) {
         const tempUser = await createFakeUser({ country: 'ar' });
         themes.push(
            await createThemePost(
               { token: tempUser.token, name: `max test theme ${i}`, category: `max test category ${i}` },
               fakeCtx,
            ),
         );
      }

      await subscribeToThemePost({ token: user.token, themeIds: themes.map(t => t.themeId) });

      user = await retrieveFullyRegisteredUser(user.token, true, fakeCtx);

      expect(user.themesSubscribed).toHaveLength(MAX_THEME_SUBSCRIPTIONS_ALLOWED);

      // Create one more theme and this one should not be possible to subscribe
      const tempUser2 = await createFakeUser({ country: 'ar' });
      const finalTheme = await createThemePost(
         { token: tempUser2.token, name: `max test theme final`, category: `max test category final` },
         fakeCtx,
      );

      await subscribeToThemePost({ token: user.token, themeIds: [finalTheme.themeId] });

      user = await retrieveFullyRegisteredUser(user.token, true, fakeCtx);
      expect(user.themesSubscribed).toHaveLength(MAX_THEME_SUBSCRIPTIONS_ALLOWED);

      // Create one more theme but this one in a different country and should be possible to subscribe
      const tempUser3 = await createFakeUser({ country: 'ru' });
      const otherCountryTheme = await createThemePost(
         { token: tempUser3.token, name: `max test theme final`, category: `max test category final` },
         fakeCtx,
      );

      await subscribeToThemePost({ token: user.token, themeIds: [otherCountryTheme.themeId] });

      user = await retrieveFullyRegisteredUser(user.token, true, fakeCtx);
      expect(user.themesSubscribed).toHaveLength(MAX_THEME_SUBSCRIPTIONS_ALLOWED + 1);
   });

   test('Admin users can create unlimited themes', async () => {
      const adminUser = await createFakeUser2({ isAdmin: true });

      for (let i = 0; i < THEMES_PER_TIME_FRAME + 2; i++) {
         await createThemePost(
            {
               token: adminUser.token,
               name: `admin user test theme ${i}`,
               category: 'test category 1',
            },
            fakeCtx,
         );
      }

      const themes = await themesCreatedByUserGet(adminUser.token);

      expect(themes).toHaveLength(THEMES_PER_TIME_FRAME + 2);
   });

   test('Unrelated user created at the beginning of the test was not affected', async () => {
      const themes = await themesCreatedByUserGet(userUnrelated.token);
      expect(themes).toHaveLength(THEMES_PER_TIME_FRAME);
   });

   afterAll(async () => {
      const testUsers = getAllTestUsersCreated();
      await queryToRemoveUsers(testUsers);
      await removeAllThemesCreatedBy(testUsers);
   });
});
