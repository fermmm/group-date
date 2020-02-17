import { UserRequestParams } from '../../common-tools/endpoints-interfaces/user';
import { 
   ProfileStatusServerResponse, 
   RegistrationStepScreen 
} from '../../common-tools/endpoints-interfaces/user';
import { createUser, getUserByToken } from './queries';

export async function profileStatusGet(params: UserRequestParams): Promise<ProfileStatusServerResponse> {
   await retreiveUser(params.token);

   return Promise.resolve({
      missingRegistrationStep: {
         screenType: RegistrationStepScreen.BasicInfo,
         screenData: null
      },
   });
}

async function retreiveUser(token: string): Promise<User> {
   // TODO: Terminar esto
   // await getUserByToken(token);
   // return createUser(token, "prueba@prueba.com");

   // Si se encuentra usuario con ese token devolverlo y listo
   // Si no se encuentra usuario pedir a facebook el mail con el token
   // Usar el mail para encontrar el usuario, guardar el token nuevo y devolver el usuario
   // Si el usuario no se encuentra con el email crear el usuario y guardar el email y token y devolver eso
   
   
   // export async function facebookTokenIsValid(token: string): Promise<boolean> {
   //    const response: { id: string; name: string } = await httpRequest({
   //       baseURL: `https://graph.facebook.com/me?access_token=${token}`,
   //       errorResponseSilent: true
   //    });
   //    return Promise.resolve(response?.name != null);
   // }
   
   
   return Promise.resolve(null);
}

// TODO: Terminarlo?
export interface User {
   id: number;
   token: string;
   email: string;
   name: string;
   birthdate: Date;
   targetAgeMin: number;
   targetAgeMax: number;
   pictures: string[];
   height?: number;
   dateIdeaName: string;
   dateIdeaAddress: string;
   profileDescription: string;
}