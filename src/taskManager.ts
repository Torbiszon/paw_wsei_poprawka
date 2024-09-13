import { Task } from './models/task';
import { MongoApi } from './api/mongoApi';
import notificationService from './notifications/notificationService'; // Import notification service

const api = new MongoApi();

const newTaskButton = document.getElementById('task-modal-new-button') as HTMLElement;
const modalNewTask = document.getElementById('task-modal-new') as HTMLElement;
const modalTaskUpdate = document.getElementById('task-container-details') as HTMLElement;
const taskListContainer = document.getElementById('task-container-list') as HTMLElement;

const statusButtonAll = document.getElementById("navigation-statuses-button-all") as HTMLElement;
const statusButtonTodo = document.getElementById("navigation-statuses-button-todo") as HTMLElement;
const statusButtonInprogress = document.getElementById("navigation-statuses-button-inprogress") as HTMLElement;
const statusButtonDone = document.getElementById("navigation-statuses-button-done") as HTMLElement;

const nameInput = document.getElementById('task-name') as HTMLInputElement;
const descriptionInput = document.getElementById('task-description') as HTMLInputElement;
const priorityInput = document.getElementById('task-priority') as HTMLSelectElement;
const estimatedTimeInput = document.getElementById('task-estimated-time') as HTMLInputElement;

const updateNameInput = document.getElementById('task-details-name') as HTMLInputElement;
const updateDescriptionInput = document.getElementById('task-details-description') as HTMLInputElement;
const updatePriorityInput = document.getElementById('task-details-priority') as HTMLSelectElement;
const updateStatusInput = document.getElementById('task-details-status') as HTMLSelectElement;
const updateEstimatedTimeInput = document.getElementById('task-details-estimated-time') as HTMLInputElement;
const updateCreationDateInput = document.getElementById('task-details-creation-date') as HTMLInputElement;
const updateStartDateInput = document.getElementById('task-details-start-date') as HTMLInputElement;
const updateEndDateInput = document.getElementById('task-details-end-date') as HTMLInputElement;
const updateUserSelect = document.getElementById('task-details-responsible') as HTMLSelectElement;

const kanbanNavigationButton = document.getElementById('task-container-button-kanban') as HTMLButtonElement;

function addTaskToList(task: Task) {
    const listElement = document.createElement('div');
    listElement.className = 'task';
    listElement.id = `${task.id}`;
    listElement.addEventListener('click', () => {
        showTaskDetails(task);
    });

    const taskName = document.createElement('div');
    taskName.textContent = `${task.name}`;
    taskName.className = 'task-name';
    listElement.appendChild(taskName);

    taskListContainer.appendChild(listElement);
}

function showTaskDetails(task: Task) {
    api.setCurrentTaskId(task.id);
    updateNameInput.value = task.name;
    updateDescriptionInput.value = task.description;
    updatePriorityInput.value = task.priority;
    updateStatusInput.value = task.status;
    updateEstimatedTimeInput.value = task.estimatedTime.toString();
    updateUserSelect.value = task.ownerId.toString();

    if (task.startDate) {
        const startDate = new Date(task.startDate);
        updateStartDateInput.value = startDate.toLocaleString().split('T')[0];
    } else {
        updateStartDateInput.value = "";
    }

    if (task.endDate) {
        const endDate = new Date(task.endDate);
        updateEndDateInput.value = endDate.toLocaleString().split('T')[0];
    } else {
        updateEndDateInput.value = "";
    }

    const dateCreation = new Date(task.creationDate);
    const formattedDateCreation = dateCreation.toISOString().split('T')[0];
    updateCreationDateInput.value = formattedDateCreation;

    taskListContainer.style.display = 'none';
    kanbanNavigationButton.style.display = 'none';
    modalTaskUpdate.style.display = 'block';
}

function clearTaskList(): void {
    taskListContainer.innerHTML = '';
}

export async function loadTasks(): Promise<void> {
    const scenarioId: number = await api.getCurrentScenarioId();
    clearTaskList();
    const tasks = await api.getTasksByScenarioId(scenarioId);
    tasks.forEach(task => addTaskToList(task));
}

async function filterTasks(status: 'all' | 'todo' | 'in progress' | 'done'): Promise<void> {
    const scenarioId: number = await api.getCurrentScenarioId();
    clearTaskList();
    let tasks = await api.getTasksByScenarioId(scenarioId);
    if (status !== 'all') {
        tasks = tasks.filter(task => task.status === status);
    }
    tasks.forEach(task => addTaskToList(task));
}

document.getElementById('task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const scenarioId: number = await api.getCurrentScenarioId();
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('User not logged in');
        return;
    }
    const priority: 'low' | 'medium' | 'high' = priorityInput.value as 'low' | 'medium' | 'high';
    const task = new Task(Date.now(), scenarioId, parseInt(userId), nameInput.value, descriptionInput.value, priority, 'todo', parseInt(estimatedTimeInput.value), new Date());
    api.createTask(task);
    addTaskToList(task);

    notificationService.send({
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${task.name}`,
        date: new Date().toISOString(),
        priority: priority,
        read: false,
    });

    nameInput.value = '';
    descriptionInput.value = '';
});

document.getElementById('task-details-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const scenarioId: number = await api.getCurrentScenarioId();
    const taskId: number = await api.getCurrentTaskId();

    if (scenarioId == null) {
        alert("No task selected for details.");
        return;
    }

    const updateStatus: 'todo' | 'in progress' | 'done' = updateStatusInput.value as 'todo' | 'in progress' | 'done';
    const updatePriority: 'low' | 'medium' | 'high' = updatePriorityInput.value as 'low' | 'medium' | 'high';

    const updateStartDateInputVal: string = (document.getElementById('task-details-start-date') as HTMLInputElement).value;
    const updateEndDateInputVal: string = (document.getElementById('task-details-end-date') as HTMLInputElement).value;

    const updateStartDate: Date = parseDate(updateStartDateInputVal);
    const updateEndDate: Date = parseDate(updateEndDateInputVal);

    const existingTask = await api.getSingleTask(taskId);
    if (!existingTask) {
        alert("Task not found.");
        return;
    }

    const updatedTask = new Task(taskId, scenarioId, parseInt(updateUserSelect.value), updateNameInput.value, updateDescriptionInput.value, updatePriority, updateStatus, parseInt(updateEstimatedTimeInput.value), existingTask.creationDate, updateStartDate, updateEndDate);
    console.log(updateStartDate, updateEndDate)
    api.updateTask(updatedTask);

    loadTasks();
    taskListContainer.style.display = 'block';
    modalTaskUpdate.style.display = 'none';
});

function parseDate(dateString: string): Date {
    const [datePart, timePart] = dateString.split(',');
    const [day, month, year] = datePart.trim().split('.').map(part => parseInt(part, 10));

    if ([day, month, year].some(isNaN)) {
        return new Date(NaN);
    }
    const [hours, minutes, seconds] = timePart ? timePart.trim().split(':').map(part => parseInt(part, 10)) : [0, 0, 0];
    if ([hours, minutes, seconds].some(isNaN)) {
        return new Date(year, month - 1, day);
    }
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const users = await api.getUsers();

        if (!users) {
            throw new Error('Failed to fetch users');
        }

        users.forEach((user: { id: number, name: string, surname: string, role: string }) => {
            if (user.role === 'devops' || user.role === 'developer') {
                const option = document.createElement('option');
                option.value = user.id.toString();
                option.textContent = `${user.name} ${user.surname}`;
                updateUserSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const deleteButton = document.getElementById('task-details-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const currentTaskId = await api.getCurrentTaskId();
            if (currentTaskId) {
                const confirmed = confirm("Are you sure you want to delete this task?");
                if (confirmed) {
                    await api.deleteTask(currentTaskId);

                    modalTaskUpdate.style.display = 'none';
                    taskListContainer.style.display = 'block';

                    await loadTasks();
                }
            } else {
                alert("No task is currently selected for deletion.");
            }
        });
    }
});

newTaskButton.addEventListener('click', async () => {
    if (await api.getCurrentScenarioId() > 0) {
        modalNewTask.style.display = "block";
    } else {
        alert("No scenario selected. Please select a scenario first.");
    }
});

updateUserSelect.addEventListener('change', async (e) => {
    const selectElement = e.target as HTMLSelectElement;
    if (selectElement) {
        const selectedUserId = selectElement.value;
        const currentTaskId = await api.getCurrentTaskId();
        if (currentTaskId) {
            const task = await api.getSingleTask(currentTaskId);
            if (task) {
                task.ownerId = parseInt(selectedUserId);

                if (task.status === 'todo') {
                    task.status = 'in progress';
                    if (!task.startDate) {
                        task.startDate = new Date();
                    }
                }

                try {
                    await api.updateTask(task);

                    const userId = localStorage.getItem('userId');
                    if (userId && parseInt(userId) === task.ownerId) {
                        notificationService.send({
                            title: 'New Task Assigned',
                            message: `You have been assigned a new task: ${task.name}`,
                            date: new Date().toISOString(),
                            priority: task.priority,
                            read: false,
                        });
                    }



                    showTaskDetails(task);
                } catch (error) {
                    console.error('Failed to update task:', error);
                    alert('Failed to update task');
                }
            }
        }
    } else {
        console.error('The event target is null.');
    }
});

updateStatusInput.addEventListener('change', async (e) => {
    const selectElement = e.target as HTMLSelectElement;
    if (selectElement) {
        const selectedStatus = selectElement.value as 'todo' | 'in progress' | 'done';
        const currentTaskId = await api.getCurrentTaskId();
        if (currentTaskId) {
            const task = await api.getSingleTask(currentTaskId);
            if (task) {
                if (task.ownerId === 1) {
                    alert("An owner must be assigned before changing the status.");
                    selectElement.value = task.status;
                    return;
                }
                if ((task.status === 'in progress' && selectedStatus === 'todo') ||
                    (task.status === 'done' && (selectedStatus === 'todo' || selectedStatus === 'in progress'))) {
                    alert("You cannot regress the status of this task.");
                    selectElement.value = task.status;
                    return;
                }
                const confirmed = confirm("Are you sure you want to change the task status?");
                if (!confirmed) {
                    selectElement.value = task.status;
                    return;
                }
                task.status = selectedStatus;
                if (selectedStatus === 'done' && !task.endDate) {
                    task.endDate = new Date();
                }
                api.updateTask(task);
                showTaskDetails(task);
            }
        }
    } else {
        console.error('The event target is null.');
    }
});

function toggleModalVisibility(event: MouseEvent, modalElement: HTMLElement, shouldBeVisible: boolean) {
    if (modalElement !== null && event.target === modalElement) {
        modalElement.style.display = shouldBeVisible ? "block" : "none";
        taskListContainer.style.display = shouldBeVisible ? "none" : "block";
        kanbanNavigationButton.style.display = shouldBeVisible ? "none" : "block";
        loadTasks();
    }
}

window.addEventListener('click', (e) => {
    toggleModalVisibility(e, modalNewTask, false);
    toggleModalVisibility(e, modalTaskUpdate, false);
});

kanbanNavigationButton.addEventListener('click', async () => {
    const kanbanContainer = document.getElementById('task-container-kanban') as HTMLElement;
    const todoContainer = document.getElementById('task-container-kanban-todo') as HTMLElement;
    const inProgressContainer = document.getElementById('task-container-kanban-inprogress') as HTMLElement;
    const doneContainer = document.getElementById('task-container-kanban-done') as HTMLElement;

    if (kanbanContainer.style.display === 'none' || kanbanContainer.style.display === '') {
        kanbanContainer.style.display = 'block';
        taskListContainer.style.display = 'none';
        newTaskButton.style.display = 'none';

        todoContainer.innerHTML = '<h2>To do</h2>';
        inProgressContainer.innerHTML = '<h2>In progress</h2>';
        doneContainer.innerHTML = '<h2>Done</h2>';

        const tasks = await api.getTasksByScenarioId(await api.getCurrentScenarioId());

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.textContent = task.name;
            taskElement.className = 'task-card';

            switch (task.status) {
                case 'todo':
                    todoContainer.appendChild(taskElement);
                    break;
                case 'in progress':
                    inProgressContainer.appendChild(taskElement);
                    break;
                case 'done':
                    doneContainer.appendChild(taskElement);
                    break;
            }
        });
    } else {
        kanbanContainer.style.display = 'none';
        taskListContainer.style.display = 'block';
        kanbanNavigationButton.style.display = 'block';
        newTaskButton.style.display = 'block';
    }
});

statusButtonAll.addEventListener('click', () => filterTasks('all'));
statusButtonTodo.addEventListener('click', () => filterTasks('todo'));
statusButtonInprogress.addEventListener('click', () => filterTasks('in progress'));
statusButtonDone.addEventListener('click', () => filterTasks('done'));
