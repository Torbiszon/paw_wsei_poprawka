import { User} from '../models/user';
import { Project } from '../models/project';
import { Scenario } from '../models/scenario';
import { Task } from '../models/task';

export class LocalStorageApi {
    private readonly storageKeys = {
        users: 'users',
        projects: 'projects',
        currentProjectId: 'currentProjectId',
        scenarios: 'scenarios',
        currentScenarioId: 'currentScenarioId',
        tasks: 'tasks',
        currentTaskId: 'currentTaskId'
    } as const;

    constructor(private storageKey: string) { }


    // Generic

    private getData<T>(): T[] {
        const dataJson = localStorage.getItem(this.storageKey);
        return dataJson ? JSON.parse(dataJson) : [];
    }

    private saveData<T>(data: T[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    private updateItem<T extends { id: number }>(id: number, update: Partial<T>): void {
        const items = this.getData<T>();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...update };
            this.saveData<T>(items);
        }
    }

     // Users

     getUsers(): User[] {
        return this.getData<User>();
    }

    saveUsers(users: User[]): void {
        this.saveData<User>(users);
    }

    createUser(user: User): void {
        const users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
    }

    getUser(id: number): User | undefined {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    updateUser(updatedUser: User): void {
        this.updateItem<User>(updatedUser.id, updatedUser);
    }

    deleteUser(id: number): void {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== id);
        this.saveUsers(filteredUsers);
    }    



    // Projects

    getProjects(): Project[] {
        return this.getData<Project>();
    }

    saveProjects(projects: Project[]): void {
        this.saveData<Project>(projects);
    }

    createProject(project: Project): void {
        const projects = this.getProjects();
        projects.push(project);
        this.saveProjects(projects);
    }

    getProject(id: number): Project | undefined {
        const projects = this.getProjects();
        return projects.find(project => project.id === id);
    }

    updateProject(updatedProject: Project): void {
        this.updateItem<Project>(updatedProject.id, updatedProject);
    }

    deleteProject(id: number): void {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(project => project.id !== id);
        this.saveProjects(filteredProjects);
    }
    

    
    // Scenarios

    getScenarios(): Scenario[] {
        return this.getData<Scenario>();
    }

    saveScenarios(scenarios: Scenario[]): void {
        this.saveData<Scenario>(scenarios);
    }

    createScenario(scenario: Scenario): void {
        const scenarios = this.getScenarios();
        scenarios.push(scenario);
        this.saveScenarios(scenarios);
    }

    getScenario(id: number): Scenario | undefined {
        const scenarios = this.getScenarios();
        return scenarios.find(scenario => scenario.id === id);
    }

    updateScenario(updatedScenario: Scenario): void {
        this.updateItem<Scenario>(updatedScenario.id, updatedScenario);
    }

    deleteScenario(id: number): void {
        const scenarios = this.getScenarios();
        const filteredScenarios = scenarios.filter(scenario => scenario.id !== id);
        this.saveScenarios(filteredScenarios);
    }
    

    deleteScenariosByProjectId(projectId: number): void {
        this.saveScenarios(this.getScenarios().filter(scenario => scenario.projectId !== projectId));
    }

    getScenariosByProjectId(projectId: number): Scenario[] {
        return this.getScenarios().filter(scenario => scenario.projectId === projectId);
    }



    // Tasks

    getTasks(): Task[] {
        return this.getData<Task>();
    }

    saveTasks(tasks: Task[]): void {
        this.saveData<Task>(tasks);
    }

    createTask(task: Task): void {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
    }

    getTask(id: number): Task | undefined {
        const tasks = this.getTasks();
        return tasks.find(task => task.id === id);
    }

    updateTask(updatedTask: Task): void {
        this.updateItem<Task>(updatedTask.id, updatedTask);
    }

    deleteTask(id: number): void {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);
        this.saveTasks(filteredTasks);
    }

    deleteTasksByScenarioId(scenarioId: number): void {
        this.saveTasks(this.getTasks().filter(task => task.scenarioId !== scenarioId));
    }

    getTasksByScenarioId(scenarioId: number): Task[] {
        return this.getTasks().filter(task => task.scenarioId === scenarioId);
    }




    // Local Storage ID management
    getCurrentId(key: string): number {
        const id: string | null = localStorage.getItem(key);
        console.log(`Current ID for key ${key}: ${id}`)
        return id ? parseInt(id) : 0;
    }

    setCurrentId(key: string, id: number): void {
        localStorage.setItem(key, id.toString());
        console.log(`Set current ID for key ${key}: ${id}`)
    }

    getCurrentProjectId(): number {
        return this.getCurrentId(this.storageKeys.currentProjectId);
    }

    setCurrentProjectId(id: number): void {
        this.setCurrentId(this.storageKeys.currentProjectId, id);
    }

    getCurrentTaskId(): number {
        return this.getCurrentId(this.storageKeys.currentTaskId);
    }

    setCurrentTaskId(id: number): void {
        this.setCurrentId(this.storageKeys.currentTaskId, id);
    }

    getCurrentScenarioId(): number {
        return this.getCurrentId(this.storageKeys.currentScenarioId);
    }

    setCurrentScenarioId(id: number): void {
        this.setCurrentId(this.storageKeys.currentScenarioId, id);
    }
}
