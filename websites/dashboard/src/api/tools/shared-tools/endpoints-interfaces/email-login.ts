export interface EmailLoginCredentials {
   email: string;
   password: string;
}

export interface EncryptedEmailLoginCredentials {
   hash: string;
}

export interface CreateAccountParams extends EmailLoginCredentials {}

export interface CreateAccountResponse {
   success?: boolean;
}

export interface ConfirmEmailParams extends EncryptedEmailLoginCredentials {}

export interface ConfirmEmailResponse {
   success?: boolean;
}

export interface LoginGetParams {
   token: string;
}

export interface LoginResponse {
   success?: boolean;
}

export interface ResetPasswordPostParams {
   email: string;
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
