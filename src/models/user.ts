
export interface SignupModel {
    phone: string;
}

export interface SignupResult {
    user: AppUser,
    token: any;
}

export interface LoginResult {
    user: AppUser,
    token: any;
}

export interface ResetPasswordResult {
    foo: string;
}

export interface ChangeSettingsResult {
    foo: string;
}

export interface ChangePasswordResult {
    foo: string;
}




export class AppUser {
    id: any = undefined;
    email: string = undefined;
    lastLogin?: Date = undefined;
    roles: Array<string> = undefined;
    language?: string = undefined;
    country?: string = undefined;
}