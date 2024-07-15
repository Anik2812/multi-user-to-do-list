// script.js

const { check } = require("express-validator");

document.addEventListener('DOMContentLoaded', function () {
    const elements = {
        loginSubmit: document.getElementById('login-submit'),
        signupSubmit: document.getElementById('signup-submit'),
        taskInput: document.getElementById('todo-input'),
        addTaskBtn: document.getElementById('add-task'),
        taskList: document.getElementById('todo-list'),
        totalTasksEl: document.getElementById('total-tasks'),
        completedTasksEl: document.getElementById('completed-tasks'),
        themeSwitch: document.getElementById('theme-switch'),
        navItems: document.querySelectorAll('nav ul li'),
        currentCategoryEl: document.querySelector('h2'),
        authTabs: document.querySelectorAll('.auth-tab'),
        authForms: document.querySelectorAll('.auth-form'),
        shareBtn: document.getElementById('Share-btn'),
        shareEmail: document.getElementById('share-email'),
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container'),
        logoutBtn: document.getElementById('logout-btn'),
        currentUserSpan: document.getElementById('current-user'),
        usernameSpan: document.getElementById('username'),
        forgotPasswordLink: document.getElementById('forgot-password-link'),
        changeAvatarBtn: document.getElementById('change-avatar-btn'),
        avatarUpload: document.getElementById('avatar-upload'),
        userAvatar: document.getElementById('user-avatar')
    };

    let currentUser = null;
    let tasks = [];

    const API_BASE_URL = 'http://localhost:5000/api';

    function checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            currentUser = JSON.parse(savedUser);
            updateUIForUser(currentUser);
            loadTasks();
            loadSharedTasks();
        } else {
            updateUIForUser(null);
        }
    }

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
    
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    
        const options = {
            method,
            headers
        };
    
        if (body) {
            options.body = JSON.stringify(body);
        }
    
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
        if (!response.ok) {
            if (response.status === 401) {
                // Token is invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                updateUIForUser(null);
                throw new Error('Session expired. Please log in again.');
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'API request failed');
        }
    
        return response.json();
    }

    async function loadTasks() {
        try {
            tasks = await apiRequest('/tasks');
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    function renderTasks(filter = 'all') {
        if (!elements.taskList) {
            console.error('Task list element not found');
            return;
        }

        elements.taskList.innerHTML = '';
        let filteredTasks = tasks;

        switch (filter) {
            case 'important':
                filteredTasks = tasks.filter(task => task.important);
                break;
            case 'upcoming':
                filteredTasks = tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(task => task.completed);
                break;
        }

        const fragment = document.createDocumentFragment();
        filteredTasks.forEach((task) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.title}</span>
                <div class="task-actions">
                    <button class="important-btn ${task.important ? 'active' : ''}"><i class="fas fa-star"></i></button>
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;

            li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task._id));
            li.querySelector('.important-btn').addEventListener('click', () => toggleImportant(task._id));
            li.querySelector('.edit-btn').addEventListener('click', () => editTask(task._id));
            li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task._id));

            fragment.appendChild(li);
        });

        elements.taskList.appendChild(fragment);
        updateTaskStats();
    }

    function updateTaskStats() {
        if (elements.totalTasksEl && elements.completedTasksEl) {
            elements.totalTasksEl.textContent = tasks.length;
            elements.completedTasksEl.textContent = tasks.filter(task => task.completed).length;
        }
    }

    async function addTask() {
        const text = elements.taskInput.value.trim();
        if (text) {
            try {
                const newTask = await apiRequest('/tasks', 'POST', { title: text, description: text });
                tasks.push(newTask);
                elements.taskInput.value = '';
                renderTasks();
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
    }

    async function toggleTask(taskId) {
        const taskIndex = tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
            try {
                const updatedTask = await apiRequest(`/tasks/${taskId}`, 'PUT', { completed: !tasks[taskIndex].completed });
                tasks[taskIndex] = updatedTask;
                renderTasks();
            } catch (error) {
                console.error('Error toggling task:', error);
            }
        }
    }

    async function toggleImportant(taskId) {
        const taskIndex = tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
            try {
                const updatedTask = await apiRequest(`/tasks/${taskId}`, 'PUT', { important: !tasks[taskIndex].important });
                tasks[taskIndex] = updatedTask;
                renderTasks();
            } catch (error) {
                console.error('Error toggling important:', error);
            }
        }
    }

    async function editTask(taskId) {
        const taskIndex = tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
            const newText = prompt('Edit task:', tasks[taskIndex].title);
            if (newText !== null) {
                try {
                    const updatedTask = await apiRequest(`/tasks/${taskId}`, 'PUT', { title: newText.trim() });
                    tasks[taskIndex] = updatedTask;
                    renderTasks();
                } catch (error) {
                    console.error('Error editing task:', error);
                }
            }
        }
    }

    async function deleteTask(taskId) {
        try {
            await apiRequest(`/tasks/${taskId}`, 'DELETE');
            tasks = tasks.filter(t => t._id !== taskId);
            renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function validatePassword(password) {
        return password.length >= 8;
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId + '-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function clearError(elementId) {
        const errorElement = document.getElementById(elementId + '-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    function updateUIForUser(user) {
        if (user) {
            elements.authContainer.style.display = 'none';
            elements.appContainer.style.display = 'block';
            elements.currentUserSpan.textContent = `Welcome, ${user.name}`;
            elements.usernameSpan.textContent = user.name;
            loadTasks();
            loadSharedTasks();
            loadUserAvatar();
        } else {
            elements.authContainer.style.display = 'flex';
            elements.appContainer.style.display = 'none';
            elements.currentUserSpan.textContent = '';
            elements.usernameSpan.textContent = '';
        }
    }

    async function handleAuth(endpoint, formData) {
        try {
            const response = await apiRequest(endpoint, 'POST', formData);
            localStorage.setItem('token', response.token);
            currentUser = { name: response.user.name, email: response.user.email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForUser(currentUser);
            loadTasks(); 
        } catch (error) {
            console.error(`${endpoint} error:`, error);
            showError(endpoint === '/auth/login' ? 'login-email' : 'signup-email', error.message);
        }
    }

    async function loadSharedTasks() {
        try {
            const sharedTasks = await apiRequest('/tasks/shared');
            console.log('Shared tasks:', sharedTasks);
            // TODO: Implement UI for shared tasks
        } catch (error) {
            console.error('Error loading shared tasks:', error);
        }
    }

    function loadUserAvatar() {
        const avatarUrl = localStorage.getItem('userAvatarUrl');
        if (avatarUrl && elements.userAvatar) {
            elements.userAvatar.src = `${API_BASE_URL}${avatarUrl}`;
        }
    }

    async function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: formData,
                });

                const data = await response.json();

                if (response.ok) {
                    elements.userAvatar.src = `${API_BASE_URL}${data.avatarUrl}`;
                    localStorage.setItem('userAvatarUrl', data.avatarUrl);
                    alert('Avatar updated successfully');
                } else {
                    throw new Error(data.message || 'Failed to update avatar');
                }
            } catch (error) {
                console.error('Avatar upload error:', error);
                alert(error.message);
            }
        }
    }

    async function checkUserSession() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, user not logged in');
            updateUIForUser(null);
            return;
        }
    
        try {
            const data = await apiRequest('/auth/user');
            console.log('User session:', data);
            updateUIForUser(data.user);
        } catch (error) {
            console.error('Error checking user session:', error);
            if (error.message === 'Session expired. Please log in again.') {
                alert(error.message);
            }
        }
    }

    // Event Listeners
    if (elements.loginSubmit) {
        elements.loginSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            clearError('login-email');
            clearError('login-password');

            if (!validateEmail(email)) {
                showError('login-email', 'Please enter a valid email address');
                return;
            }

            if (!validatePassword(password)) {
                showError('login-password', 'Password must be at least 8 characters long');
                return;
            }

            await handleAuth('/auth/login', { email, password });
        });
    }

    if (elements.signupSubmit) {
        elements.signupSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            clearError('signup-name');
            clearError('signup-email');
            clearError('signup-password');

            if (!name) {
                showError('signup-name', 'Name is required');
                return;
            }

            if (!validateEmail(email)) {
                showError('signup-email', 'Please enter a valid email address');
                return;
            }

            if (!validatePassword(password)) {
                showError('signup-password', 'Password must be at least 8 characters long');
                return;
            }

            await handleAuth('/auth/signup', { name, email, password });
        });
    }

    if (elements.addTaskBtn) {
        elements.addTaskBtn.addEventListener('click', addTask);
    }

    if (elements.taskInput) {
        elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }

    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', async () => {
            const email = elements.shareEmail.value.trim();
            if (validateEmail(email)) {
                try {
                    await apiRequest('/tasks/share', 'POST', { email });
                    elements.shareEmail.value = '';
                    alert('Tasks shared successfully');
                } catch (error) {
                    console.error('Error sharing tasks:', error);
                    alert(error.message || 'Failed to share tasks. Please try again.');
                }
            } else {
                alert('Invalid email address');
            }
        });
    }

    if (elements.themeSwitch) {
        elements.themeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
        });
    }

    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userAvatarUrl');
            updateUIForUser(null);
        });
    }

    if (elements.changeAvatarBtn) {
        elements.changeAvatarBtn.addEventListener('click', () => {
            elements.avatarUpload.click();
        });
    }

    if (elements.avatarUpload) {
        elements.avatarUpload.addEventListener('change', handleAvatarUpload);
    }

    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            elements.navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            const category = item.dataset.category;
            elements.currentCategoryEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            renderTasks(category);
        });
    });
    elements.authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.authTabs.forEach(t => t.classList.remove('active'));
            elements.authForms.forEach(f => f.classList.remove('active'));
    
            tab.classList.add('active');
            const targetForm = document.getElementById(`${tab.dataset.tab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    if (elements.forgotPasswordLink) {
        elements.forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt("Please enter your email address:");
            if (email && validateEmail(email)) {
                try {
                    await apiRequest('/auth/forgot-password', 'POST', { email });
                    alert('Password reset instructions have been sent to your email.');
                } catch (error) {
                    console.error('Forgot password error:', error);
                    alert(error.message);
                }
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }

    // Function to initialize the application
    async function checkUserSession() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, user not logged in');
            updateUIForUser(null);
            return;
        }
    
        try {
            const data = await apiRequest('/auth/user');
            console.log('User session:', data);
            updateUIForUser(data.user);
        } catch (error) {
            console.error('Error checking user session:', error);
            if (error.message === 'Session expired. Please log in again.') {
                alert(error.message);
            }
        }
    }

    // Call the init function when the DOM is loaded
    init();
    
    checkUserSession();

});