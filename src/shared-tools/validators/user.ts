import * as Validator from 'fastest-validator';
import { Gender } from '../endpoints-interfaces/user';

const v = new ((Validator as unknown) as typeof Validator.default)();

export const editableUserPropsSchema = {
   name: { type: 'string', min: 2, max: 22, optional: true },
   birthdate: { type: 'string', min: 6, max: 40, optional: true },
   targetAgeMin: { type: 'number', min: 13, max: 100, optional: true },
   targetAgeMax: { type: 'number', min: 13, max: 100, optional: true },
   pictures: { type: 'array', items: 'string', min: 1, max: 6, optional: true },
   dateIdeaName: { type: 'string', min: 3, max: 100, optional: true },
   dateIdeaAddress: { type: 'string', min: 3, max: 200, optional: true },
   profileDescription: { type: 'string', max: 4000, optional: true },
   locationLat: { type: 'number', optional: true },
   locationLon: { type: 'number', optional: true },
};

export type EditableUserProp = keyof typeof editableUserPropsSchema;

export const editableUserPropsList: EditableUserProp[] = Object.keys(editableUserPropsSchema) as EditableUserProp[];

export const validateUserProps = v.compile(editableUserPropsSchema);
