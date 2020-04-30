import * as Validator from 'fastest-validator';
import { Gender, UserPropsValueTypes } from '../endpoints-interfaces/user';

const v = new ((Validator as unknown) as typeof Validator.default)();

export const editableUserPropsSchema = {
   name: { type: 'string', min: 2, max: 32, optional: true },
   age: { type: 'number', min: 18, max: 120, optional: true },
   targetAgeMin: { type: 'number', min: 18, max: 120, optional: true },
   targetAgeMax: { type: 'number', min: 18, max: 120, optional: true },
   targetDistance: { type: 'number', min: 25, max: 150, optional: true },
   pictures: { type: 'array', items: 'url', min: 1, max: 6, optional: true },
   dateIdeaName: { type: 'string', min: 3, max: 100, optional: true },
   dateIdeaAddress: { type: 'string', min: 3, max: 200, optional: true },
   profileDescription: { type: 'string', max: 4000, optional: true },
   locationLat: { type: 'number', optional: true },
   locationLon: { type: 'number', optional: true },
   likesWoman: { type: 'boolean', optional: true },
   likesMan: { type: 'boolean', optional: true },
   likesWomanTrans: { type: 'boolean', optional: true },
   likesManTrans: { type: 'boolean', optional: true },
   likesOtherGenders: { type: 'boolean', optional: true },
   gender: { type: 'enum', values: Object.values(Gender), optional: true },
   height: { type: 'number', min: 100, max: 300, optional: true },
   sendNewUsersNotification: { type: 'number', min: 0, max: 50, optional: true },
};

export type ExposedUserPropKey = keyof typeof editableUserPropsSchema;

export type ExposedUserProps = Partial<Record<ExposedUserPropKey, UserPropsValueTypes>>;

export const editableUserPropsList: ExposedUserPropKey[] = Object.keys(
   editableUserPropsSchema,
) as ExposedUserPropKey[];

export const validateUserProps = v.compile(editableUserPropsSchema);
