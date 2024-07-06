document.addEventListener('DOMContentLoaded', function () {
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
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const shareBtn = document.getElementById('Share-btn');
    const shareEmail = document.getElementById('share-email');

    let currentUser = null;
    let tasks = [];

    function checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUIForUser();
        }
    }

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

            // Set up share functionality

            // if (shareBtn && shareEmail) {
            //     shareBtn.addEventListener('click', (e) => {
            //         e.preventDefault();
            //         const email = shareEmail.value;

            //         clearError('share-email');

            //         if (!validateEmail(email)) {
            //             showError('share-email', 'Please enter a valid email address');
            //             return;
            //         }

            //         // If validation passes, proceed with sharing
            //         alert(`Task list shared with ${email}`);
            //         shareEmail.value = '';
            //     });
            // }
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    }

    loginSubmit.addEventListener('click', async (e) => {
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
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            if (!response.ok) {
                throw new Error('Login failed');
            }
    
            const data = await response.json();
            currentUser = { name: data.user.name, email: data.user.email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('token', data.token);
            updateUIForUser();
        } catch (error) {
            showError('login-email', 'Login failed. Please check your credentials.');
            console.error('Login error:', error);
        }
    }); 

    signupSubmit.addEventListener('click', async (e) => {
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

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });
    
            if (!response.ok) {
                throw new Error('Signup failed');
            }
    
            const data = await response.json();
            currentUser = { name, email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForUser();
            alert(`Welcome, ${name}! Your account has been created successfully.`);
        } catch (error) {
            showError('signup-email', 'Signup failed. This email might already be in use.');
            console.error('Signup error:', error);
        }
    });
    shareBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = shareEmail.value;

        clearError('share-email');

        if (!validateEmail(email)) {
            showError('share-email', 'Please enter a valid email address');
            return;
        }

        try {
            const response = await fetch('/tasks/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error('Sharing failed');
            }

            alert(`Task list shared with ${email}`);
            shareEmail.value = '';
        } catch (error) {
            showError('share-email', 'Sharing failed. User might not exist.');
        }
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIForUser();
    });

    checkExistingSession();

    async function loadTasks() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/tasks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filter = 'all', sharedTasks = null) {
        taskList.innerHTML = '';
        let filteredTasks = tasks;

        if (filter === 'shared') {
            filteredTasks = sharedTasks;
        } else {
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
        }

        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <div class="task-actions">
                    ${filter !== 'shared' ? `
                        <button class="important-btn ${task.important ? 'active' : ''}"><i class="fas fa-star"></i></button>
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </div>
            `;


            taskList.appendChild(li);
        });

        updateTaskStats();



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
            if (category === 'shared') {
                loadSharedTasks();
            } else {
                renderTasks(category);
            }
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

    async function loadSharedTasks() {
        try {
            const response = await fetch('/tasks/shared', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load shared tasks');
            }

            const sharedTasks = await response.json();
            renderTasks('shared', sharedTasks);
        } catch (error) {
            console.error('Error loading shared tasks:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('login-submit');
        const logoutBtn = document.getElementById('logout-btn');
    
        // Handle Login
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = '/auth0';
            });
        }
    
        // Handle Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.location.href = '/logout';
            });
        }
    
        // Check if the user is authenticated
        fetch('/user').then(response => response.json()).then(data => {
            if (data.user) {
                document.getElementById('auth-container').style.display = 'none';
                document.getElementById('app-container').style.display = 'block';
                document.getElementById('current-user').textContent = `Welcome, ${data.user.displayName}`;
                document.getElementById('username').textContent = data.user.displayName;
            } else {
                document.getElementById('auth-container').style.display = 'block';
                document.getElementById('app-container').style.display = 'none';
            }
        });
    });
    



    // Initial setup
    updateUIForUser();
});