import { MongoApi } from './api/mongoApi';
import { loadProjects } from './projectManager';
import { loadScenarios } from './scenarioManager';
import { loadTasks } from './taskManager';
import { initializeUnreadNotificationCounter, initializeAllNotificationsView, initializeNotificationDialog, initializeReadAllButton } from './notifications/notificationCompontents';

const api = new MongoApi

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setDarkLightToggle();
    setupNavigation();
    loadProjects();
    setupLoginForm();
    initializeUnreadNotificationCounter();
    initializeAllNotificationsView();
    setNotificationToggle();
    initializeNotificationDialog();
    initializeReadAllButton();
}

async function setupLoginForm() {
    const loginContainer = document.getElementById('container-login') as HTMLElement;
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const loginButton = document.getElementById('login-button') as HTMLButtonElement;

    if (await api.areTokensPresent()) {
        loginContainer.style.display = 'none';
    } else {
        loginContainer.style.display = 'block';
    }

    loginButton.addEventListener('click', () => {
        loginContainer.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        try {
            const { token, refreshToken, userId } = await api.login(username, password);
            localStorage.setItem('userId', userId);
            await api.saveTokens(token, refreshToken);
            alert('Login successful!');
            loginContainer.style.display = 'none';
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed');
            loginContainer.style.display = 'block';
        }
    });
}


const setDarkLightToggle = () => {
    const themeButton = document.getElementById('toggle-theme-button') as HTMLButtonElement;
    themeButton.addEventListener('click', function () {
        if (document.body.classList.toggle('dark-mode')) {
            themeButton.textContent = 'Jasny';
        } else {
            themeButton.textContent = 'Ciemny';
        }
    });
}

const setNotificationToggle = () => {
    document.getElementById('notification-bubble')?.addEventListener('click', () => {
        const notificationPanel = document.getElementById('notification-panel');
        if (notificationPanel) {
            notificationPanel.classList.toggle('show');
        }
    });
};


const setupNavigation = () => {
    document.getElementById('tasklist-navigation-button')?.addEventListener('click', () => {
        navigateToSection('task');
    });

    document.getElementById('projectlist-navigation-button')?.addEventListener('click', () => {
        navigateToSection('project');
    });

    document.getElementById('scenariolist-navigation-button')?.addEventListener('click', () => {
        navigateToSection('scenario');
    });
}

async function navigateToSection(section: 'project' | 'task' | 'scenario') {
    const projectId: number = await api.getCurrentProjectId();
    const scenarioId: number = await api.getCurrentScenarioId();

    const projectListContainer = document.getElementById('project-container-list') as HTMLElement;
    const taskListContainer = document.getElementById('task-container-list') as HTMLElement;
    const scenarioListContainer = document.getElementById('scenario-container-list') as HTMLElement;

    const ProjectModalNewButton = document.getElementById('project-modal-new-button') as HTMLButtonElement;
    const ScenarioModalNewButton = document.getElementById('scenario-modal-new-button') as HTMLButtonElement;
    const TaskModalNewButton = document.getElementById('task-modal-new-button') as HTMLButtonElement;

    const navigationStatuses = document.getElementById('navigation-statuses') as HTMLElement;

    const kanbanNavigationButton = document.getElementById('task-container-button-kanban') as HTMLButtonElement;
    const kanbanContainer = document.getElementById('task-container-kanban') as HTMLElement;

    [projectListContainer, taskListContainer, scenarioListContainer].forEach(container => container.style.display = 'none');
    navigationStatuses.style.display = 'none';

    [ProjectModalNewButton, ScenarioModalNewButton, TaskModalNewButton].forEach(button => button.style.display = 'none');
    navigationStatuses.style.display = 'none';

    if (projectId <= 0) {
        alert("No project selected. Please select a project first.");
        section = 'project';
    }

    switch (section) {
        case 'project':
            ProjectModalNewButton.style.display = 'block';
            projectListContainer.style.display = 'block';
            navigationStatuses.style.display = 'none';
            kanbanNavigationButton.style.display = 'none';
            break;
        case 'scenario':
            ScenarioModalNewButton.style.display = 'block';
            scenarioListContainer.style.display = 'block';
            navigationStatuses.style.display = 'flex';
            kanbanNavigationButton.style.display = 'none';
            await loadScenarios();
            break;
        case 'task':
            if (scenarioId <= 0) {
                alert("No scenario selected. Please select a scenario first.");
                ScenarioModalNewButton.style.display = 'block';
                scenarioListContainer.style.display = 'block';
                navigationStatuses.style.display = 'flex';
                kanbanNavigationButton.style.display = 'none';
            } else {
                TaskModalNewButton.style.display = 'block';
                kanbanNavigationButton.style.display = 'block';
                taskListContainer.style.display = 'block';
                navigationStatuses.style.display = 'flex';
                kanbanContainer.style.display = 'none';
                await loadTasks();
                break;
            }
    }
}

