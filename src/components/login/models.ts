import { LoginRequestParams } from '../../common-tools/endpoints-interfaces/login';
import { 
   RegistrationStepScreen, 
   ServerLoginResponse 
} from '../../common-tools/endpoints-interfaces/login';

export function loginPost(params: LoginRequestParams): ServerLoginResponse {
   return {
      success: true,
      showRegistrationStepScreen: {
         screenType: RegistrationStepScreen.BasicInfo,
         screenData: null
      },
   };
}

