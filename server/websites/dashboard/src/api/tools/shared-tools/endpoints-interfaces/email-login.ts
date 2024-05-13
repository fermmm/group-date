export interface EmailLoginCredentials {
   email: string;
   password: string;
}

export interface EncryptedEmailLoginCredentials {
   hash: string;
}

export interface CreateAccountParams extends EmailLoginCredentials {
   appUrl: string;
   /** For testing in case the email is not sent (it may not be sent from a localhost testing server) */
   logLinkOnConsole?: boolean;
}

export interface CreateAccountResponse {
   success?: boolean;
}

export interface ConfirmEmailParams extends EncryptedEmailLoginCredentials {}

export interface ConfirmEmailResponse {
   success?: boolean;
}

export type LoginGetParams = Partial<EmailLoginCredentials & { token?: string }>;

export interface LoginResponse {
   userExists: boolean;
   token?: string;
}

export interface ResetPasswordPostParams {
   email: string;
   appUrl: string;
}

export interface ResetPasswordResponse {
   success?: boolean;
}

export interface ChangePasswordPostParams {
   newPassword: string;
   hash: string;
}

export interface ChangePasswordResponse {
   success?: boolean;
}

export interface ChangePasswordCredentials {
   userId: string;
   tokenHashed: string;
}

export interface ResetPasswordResponse {
   success?: boolean;
}

export interface UserExistsGetParams {
   email: string;
}

export interface UserExistsResponse {
   userExists: boolean;
}
