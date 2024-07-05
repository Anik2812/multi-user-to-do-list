document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginSubmit = document.getElementById('login-submit');
    const signupSubmit = document.getElementById('signup-submit');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserSpan = document.getElementById('current-user');
    const usernameSpan = document.getElementById('username');
    const taskInput = document.getElementById('todo-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('todo-list');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const themeSwitch = document.getElementById('theme-switch');
    const navItems = document.querySelectorAll('nav ul li');
    const currentCategoryEl = document.querySelector('h2');
    const shareEmail = document.getElementById('share-email');
    const ShareBtn = document.getElementById('Share-btn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    let currentUser = null;
    let tasks = [];

    // Add these functions at the very beginning of script.js

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(password);
}

function showError(elementId, message) {
    const inputElement = document.getElementById(elementId);
    let errorElement = document.getElementById(elementId + '-error');
    
    if (!errorElement && inputElement) {
        errorElement = document.createElement('div');
        errorElement.id = elementId + '-error';
        errorElement.className = 'error-message';
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        console.warn(`Error element for ${elementId} not found and could not be created`);
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId + '-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

    function updateUIForUser() {
        if (currentUser) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            currentUserSpan.textContent = `Welcome, ${currentUser.name}`;
            usernameSpan.textContent = currentUser.name;
            loadTasks();
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    }

    function showError(message) {
        alert(message);  // You can replace this with a more user-friendly UI element
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    async function login(email, password) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                currentUser = data.user;
                updateUIForUser();
            } else {
                showError(data.error);
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }

    async function signup(name, email, password) {
        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert('User created successfully');
                document.querySelector('[data-tab="login"]').click();
            } else {
                showError(data.error);
            }
        } catch (error) {
            console.error('Error signing up:', error);
        }
    }

    // Replace the existing loginSubmit event listener with this:
loginSubmit.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    clearError('login-email');
    clearError('login-password');
    
    if (!validateEmail(email)) {
        showError('login-email', 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 8) {
        showError('login-password', 'Password must be at least 8 characters long');
        return;
    }
    
    // If validation passes, proceed with login
    currentUser = { name: email.split('@')[0], email: email };
    updateUIForUser();
});

// Replace the existing signupSubmit event listener with this:
signupSubmit.addEventListener('click', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    clearError('signup-name');
    clearError('signup-email');
    clearError('signup-password');
    
    if (name.length < 2) {
        showError('signup-name', 'Name must be at least 2 characters long');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('signup-email', 'Please enter a valid email address');
        return;
    }
    
    if (!validatePassword(password)) {
        showError('signup-password', 'Password must be at least 8 characters long, contain 1 uppercase, 1 lowercase, and 1 number');
        return;
    }
    
    // If validation passes, proceed with signup
    currentUser = { name: name, email: email };
    updateUIForUser();
});

// Replace the existing Sharebtn event listener with this:
ShareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const email = shareEmail.value;
    
    clearError('share-email');
    
    if (!validateEmail(email)) {
        showError('share-email', 'Please enter a valid email address');
        return;
    }
    
    // If validation passes, proceed with sharing
    alert(`Task list shared with ${email}`);
    shareEmail.value = '';
});

    async function loadTasks() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/tasks', {
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (response.ok) {
                tasks = data;
                renderTasks();
            } else {
                console.error('Error loading tasks:', data.error);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async function saveTasks() {
        try {
            const token = localStorage.getItem('token');
            await fetch('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ tasks })
            });
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    function renderTasks(filter = 'all') {
        taskList.innerHTML = '';
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

        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <div class="task-actions">
                    <button class="important-btn ${task.important ? 'active' : ''}"><i class="fas fa-star"></i></button>
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;

            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(index));

            const importantBtn = li.querySelector('.important-btn');
            importantBtn.addEventListener('click', () => toggleImportant(index));

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editTask(index));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(index));

            taskList.appendChild(li);
        });

        updateTaskStats();
    }

    function updateTaskStats() {
        totalTasksEl.textContent = tasks.length;
        completedTasksEl.textContent = tasks.filter(task => task.completed).length;
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text, completed: false, important: false });
            taskInput.value = '';
            saveTasks();
            renderTasks();
        }
    }

    function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function toggleImportant(index) {
        tasks[index].important = !tasks[index].important;
        saveTasks();
        renderTasks();
    }

    function editTask(index) {
        const newText = prompt('Edit task:', tasks[index].text);
        if (newText !== null) {
            tasks[index].text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const category = item.getAttribute('data-category');
            currentCategoryEl.textContent = item.textContent.trim();
            renderTasks(category);
        });
    });

    themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
    });

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            authForms.forEach(form => form.style.display = 'none');
            document.getElementById(tab.getAttribute('data-tab')).style.display = 'block';
        });
    });

    document.querySelector('[data-tab="login"]').click();

    const token = localStorage.getItem('token');
    if (token) {
        fetch('/auth/me', {
            headers: { 'x-auth-token': token }
        })
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    currentUser = data.user;
                    updateUIForUser();
                }
            })
            .catch(error => {
                console.error('Error fetching current user:', error);
            });
    } else {
        updateUIForUser();
    }
});
