import { User, UserRole } from './models/user';

export const users = [
    new User(1, "Admin", "Admin", UserRole.admin, "admin"),
    new User(2, "Adam", "Nowak", UserRole.developer, "admin"),
    new User(3, "Paweł", "Kowalski", UserRole.devops, "admin")
];

export const loggedInUser = users[0]
