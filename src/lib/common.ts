import 'reflect-metadata';

export const UserRoles = {
    admin: 'admin',
    user: 'user',
    editor: 'editor'
}

export class IntegrationInfo<T> {
    public data?: T;

    toClient(): any {
        return {};
    }

    constructor(public remoteId: string) {

    }
}


export class Auth {
    static Anonymous() {
        var fn = () => {
            return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
                Reflect.defineMetadata('auth:anonymous', {}, descriptor.value);
            }
        }
        return fn();
    }

    static GetAnonymous(target: any) {
        return Reflect.getMetadata('auth:anonymous', target);
    }
}