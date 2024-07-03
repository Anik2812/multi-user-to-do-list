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
    const shareBtn = document.getElementById('Share-btn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    let currentUser = null;
    let tasks = [];

    const API_URL = 'http://localhost:5000/api';

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

    async function signup(name, email, password) {
        try {
            console.log("Sending signup request:", { name, email, password });
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });
            console.log("Signup response status:", response.status);
            const data = await response.json();
            console.log("Signup response data:", data);
            if (response.ok) {
                alert('Signup successful. Please log in.');
            } else {
                alert(`Signup failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert(`An error occurred during signup: ${error.message}`);
        }
    }
    
    async function login(email, password) {
        try {
            console.log("Sending login request:", { email, password });
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            console.log("Login response status:", response.status);
            const data = await response.json();
            console.log("Login response data:", data);
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('token', data.token);
                updateUIForUser();
            } else {
                alert(`Login failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(`An error occurred during login: ${error.message}`);
        }
    }

    async function loadTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: {
                    'Authorization': localStorage.getItem('token'),
                },
            });
            if (response.ok) {
                tasks = await response.json();
                renderTasks();
            } else {
                throw new Error('Failed to load tasks');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            alert('Failed to load tasks');
        }
    }

    async function addTask(text) {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token'),
                },
                body: JSON.stringify({ text, completed: false, important: false }),
            });
            if (response.ok) {
                const newTask = await response.json();
                tasks.push(newTask);
                renderTasks();
            } else {
                throw new Error('Failed to add task');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task');
        }
    }

    async function updateTask(id, updates) {
        try {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token'),
                },
                body: JSON.stringify(updates),
            });
            if (response.ok) {
                const updatedTask = await response.json();
                const index = tasks.findIndex(task => task._id === id);
                if (index !== -1) {
                    tasks[index] = updatedTask;
                    renderTasks();
                }
            } else {
                throw new Error('Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task');
        }
    }

    async function deleteTask(id) {
        try {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': localStorage.getItem('token'),
                },
            });
            if (response.ok) {
                tasks = tasks.filter(task => task._id !== id);
                renderTasks();
            } else {
                throw new Error('Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    }

    function renderTasks(filter = 'all') {
        taskList.innerHTML = '';
        let filteredTasks = tasks;

        switch(filter) {
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

        filteredTasks.forEach((task) => {
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
            checkbox.addEventListener('change', () => updateTask(task._id, { completed: !task.completed }));

            const importantBtn = li.querySelector('.important-btn');
            importantBtn.addEventListener('click', () => updateTask(task._id, { important: !task.important }));

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                const newText = prompt('Edit task:', task.text);
                if (newText !== null) {
                    updateTask(task._id, { text: newText.trim() });
                }
            });

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task._id));

            taskList.appendChild(li);
        });

        updateTaskStats();
    }

    function updateTaskStats() {
        totalTasksEl.textContent = tasks.length;
        completedTasksEl.textContent = tasks.filter(task => task.completed).length;
    }

    loginSubmit.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        login(email, password);
    });

    signupSubmit.addEventListener('click', () => {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signup(name, email, password);
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('token');
        updateUIForUser();
    });

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = '';
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = taskInput.value.trim();
            if (text) {
                addTask(text);
                taskInput.value = '';
            }
        }
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
            const targetForm = tab.getAttribute('data-tab');
            
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetForm}-form`).classList.add('active');
        });
    });

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // You might want to validate the token here
        // For now, we'll just set the user as logged in
        currentUser = { name: 'User' }; // You should decode the token to get the actual user info
        updateUIForUser();
    }

    // Initial setup
    updateUIForUser();
});