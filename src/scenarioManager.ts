import { Scenario } from './models/scenario';
import { loggedInUser } from './userContext';
import { MongoApi } from './api/mongoApi';

const api = new MongoApi;

const newScenarioButton = document.getElementById('scenario-modal-new-button') as HTMLElement;
const modalNewScenario = document.getElementById('scenario-modal-new') as HTMLElement;
const modalScenarioUpdate = document.getElementById('scenario-modal-update') as HTMLElement;
const scenarioListContainer = document.getElementById('scenario-container-list') as HTMLElement;
const nameInput = document.getElementById('scenario-name') as HTMLInputElement;
const descriptionInput = document.getElementById('scenario-description') as HTMLInputElement;
const priorityInput = document.getElementById('scenario-priority') as HTMLSelectElement;
const updateNameInput = document.getElementById('scenario-details-name') as HTMLInputElement;
const updateDescriptionInput = document.getElementById('scenario-details-description') as HTMLInputElement;
const updatePriorityInput = document.getElementById('scenario-details-priority') as HTMLSelectElement;
const updateStatusInput = document.getElementById('scenario-details-status') as HTMLSelectElement;
const statusButtonAll = document.getElementById("navigation-statuses-button-all") as HTMLElement;
const statusButtonTodo = document.getElementById("navigation-statuses-button-todo") as HTMLElement;
const statusButtonInprogress = document.getElementById("navigation-statuses-button-inprogress") as HTMLElement;
const statusButtonDone = document.getElementById("navigation-statuses-button-done") as HTMLElement;

function addScenarioToList(scenario: Scenario) {
    const listElement = document.createElement('div');
    listElement.className = 'scenario';
    listElement.id = `${scenario.id}`;
    listElement.addEventListener('click', () => {
        showScenarioDetails(scenario);
    });

    const scenarioName = document.createElement('div');
    scenarioName.textContent = `${scenario.name}`;
    scenarioName.className = 'scenario-name';
    listElement.appendChild(scenarioName);

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'scenario-actions';
    const selectButton = document.createElement('button');
    selectButton.textContent = 'Select';
    selectButton.addEventListener('click', (event) => {
        event.stopPropagation();
        api.setCurrentScenarioId(scenario.id);
        setCurrentScenarioColor(scenario.id);
    });

    actionsContainer.appendChild(selectButton);
    listElement.appendChild(actionsContainer);

    scenarioListContainer.appendChild(listElement);
}

function setCurrentScenarioColor(id: number): void {

    const allScenarios = document.querySelectorAll('.scenario');
    allScenarios.forEach((scenario) => {
        (scenario as HTMLElement).style.backgroundColor = '';
    });

    const selectedScenario = document.getElementById(`${id}`);
    if (selectedScenario) {
        selectedScenario.style.backgroundColor = '#999999';
    }
}

function showScenarioDetails(scenario: Scenario): void {
    api.setCurrentScenarioId(scenario.id);
    setCurrentScenarioColor(scenario.id);
    updateNameInput.value = scenario.name;
    updateDescriptionInput.value = scenario.description;
    updatePriorityInput.value = scenario.priority;
    updateStatusInput.value = scenario.status;
    modalScenarioUpdate.style.display = 'block';
}

newScenarioButton.addEventListener('click', async () => {
    const projectId: number = await api.getCurrentProjectId();
    if (projectId > 0) {
        modalNewScenario.style.display = "block";
    } else {
        alert("No project selected. Please select a project first.");
    }
});

statusButtonAll.addEventListener('click', () => filterScenarios('all'));
statusButtonTodo.addEventListener('click', () => filterScenarios('todo'));
statusButtonInprogress.addEventListener('click', () => filterScenarios('in progress'));
statusButtonDone.addEventListener('click', () => filterScenarios('done'));

document.getElementById('scenario-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const projectId: number = await api.getCurrentProjectId();
    const priority: 'low' | 'medium' | 'high' = priorityInput.value as 'low' | 'medium' | 'high';
    const scenario = new Scenario(Date.now(), nameInput.value, descriptionInput.value, priority, projectId, new Date(), 'todo', loggedInUser.id);
    api.createScenario(scenario);
    addScenarioToList(scenario);
    nameInput.value = '';
    descriptionInput.value = '';
});

document.getElementById('scenario-details-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (await api.getCurrentScenarioId() == null) {
        alert("No scenario selected for details.");
        return;
    }

    const scenarioId = await api.getCurrentScenarioId();
    const existingScenario = await api.getSingleScenario(scenarioId);

    if (!existingScenario) {
        alert("Scenario not found.");
        return;
    }

    const updatePriority: 'low' | 'medium' | 'high' = updatePriorityInput.value as 'low' | 'medium' | 'high';
    const updateStatus: 'todo' | 'in progress' | 'done' = updateStatusInput.value as 'todo' | 'in progress' | 'done';
    const updatedScenario = new Scenario(
        existingScenario.id, 
        updateNameInput.value, 
        updateDescriptionInput.value, 
        updatePriority, 
        existingScenario.projectId, 
        existingScenario.creationDate, 
        updateStatus, 
        loggedInUser.id
    );

    await api.updateScenario(updatedScenario);

    await loadScenarios();

    scenarioListContainer.style.display = 'block';
    modalScenarioUpdate.style.display = 'none';
});

document.addEventListener("DOMContentLoaded", () => {
    const deleteButton = document.getElementById('scenario-details-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => { 
            const currentTaskId = await api.getCurrentTaskId();
            if (currentTaskId) {
                const confirmed = confirm("Are you sure you want to delete this scenario?");
                if (confirmed) {
                    await api.deleteScenario(await api.getCurrentScenarioId()); 

                    scenarioListContainer.style.display = 'block';
                    modalScenarioUpdate.style.display = 'none';

                    await loadScenarios(); 
                }
            } else {
                alert("No scenario is currently selected for deletion.");
            }
        });
    }
});



window.addEventListener('click', (event) => {
    toggleModalVisibility(event, modalNewScenario, false);
    toggleModalVisibility(event, modalScenarioUpdate, false);
});

function toggleModalVisibility(event: MouseEvent, modalElement: HTMLElement, shouldBeVisible: boolean) {
    if (modalElement !== null && event.target === modalElement) {
        modalElement.style.display = shouldBeVisible ? "block" : "none";
        scenarioListContainer.style.display = shouldBeVisible ? "none" : "block";
    }
}

export async function loadScenarios(): Promise<void> {
    const projectId: number = await api.getCurrentProjectId();
    clearScenarioList();
    const scenarios = await api.getScenariosByProjectId(projectId);
    scenarios.forEach(scenario => addScenarioToList(scenario));
    const scenarioId = await api.getCurrentScenarioId();
    setCurrentScenarioColor(scenarioId);
}

function clearScenarioList(): void {
    scenarioListContainer.innerHTML = '';
}

async function filterScenarios(status: 'all' | 'todo' | 'in progress' | 'done'): Promise<void> {
    const projectId: number = await api.getCurrentProjectId();
    clearScenarioList();
    const scenarios = await api.getScenariosByProjectId(projectId);

    let filteredScenarios: Scenario[];
    if (status !== 'all') {
        filteredScenarios = scenarios.filter((scenario: Scenario) => scenario.status === status);
    } else {
        filteredScenarios = scenarios;
    }

    filteredScenarios.forEach((scenario: Scenario) => addScenarioToList(scenario));
    const scenarioId = await api.getCurrentScenarioId();
    setCurrentScenarioColor(scenarioId);
}
