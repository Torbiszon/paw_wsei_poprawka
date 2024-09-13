export enum UserRole {
    admin = 'admin',
    devops = 'devops',
    developer = 'developer'
}

export class User {
    constructor(public id: number, public name: string, public surname: string, public role: UserRole, public password: string) { }
}
