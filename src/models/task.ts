export class Task {
    constructor(
        public id: number,
        public scenarioId: number,
        public ownerId: number,
        public name: string,
        public description: string,
        public priority: 'low' | 'medium' | 'high',
        public status: 'todo' | 'in progress' | 'done',
        public estimatedTime: number,
        public creationDate: Date,
        public startDate?: Date,
        public endDate?: Date,
    ) { }
}
