document.addEventListener('DOMContentLoaded', function () {
    const loginSubmit = document.getElementById('login-submit');
    const signupSubmit = document.getElementById('signup-submit');
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
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserSpan = document.getElementById('current-user');
    const usernameSpan = document.getElementById('username');

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

    function updateUIForUser(user) {
        if (user) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            currentUserSpan.textContent = `Welcome, ${user.name}`;
            usernameSpan.textContent = user.name;
            loadTasks();
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    }

    const checkUserSession = async () => {
        try {
            const response = await fetch('/api/auth/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            const data = await response.json();
            // Do something with the user data
            console.log(data);
        } catch (error) {
            console.error('Error checking user session:', error);
        }
    };
    
    const loadSharedTasks = async () => {
        try {
            const response = await fetch('/api/tasks/shared', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });            
            if (!response.ok) {
                throw new Error('Failed to load shared tasks');
            }
            const tasks = await response.json();
            // Do something with the tasks data
            console.log(tasks);
        } catch (error) {
            console.error('Error loading shared tasks:', error);
        }
    };
    

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filter = 'all', sharedTasks = null) {
        if (!taskList) return;  // Check if taskList exists

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
        if (totalTasksEl && completedTasksEl) {
            totalTasksEl.textContent = tasks.length;
            completedTasksEl.textContent = tasks.filter(task => task.completed).length;
        }
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
        if (newText) {
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

    if (loginSubmit) {
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

            if (!validatePassword(password)) {
                showError('login-password', 'Password must be at least 8 characters long and include at least one number, one uppercase letter, and one lowercase letter');
                return;
            }

            try {
                const response = await fetch('api/auth/login', {
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
                updateUIForUser(data.user);
            } catch (error) {
                showError('login-email', 'Login failed. Please check your credentials.');
                console.error('Login error:', error);
            }
        });
    }

    if (signupSubmit) {
        signupSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            clearError('signup-email');
            clearError('signup-password');
            clearError('confirm-password');

            if (!validateEmail(email)) {
                showError('signup-email', 'Please enter a valid email address');
                return;
            }

            if (!validatePassword(password)) {
                showError('signup-password', 'Password must be at least 8 characters long and include at least one number, one uppercase letter, and one lowercase letter');
                return;
            }

            if (password !== confirmPassword) {
                showError('confirm-password', 'Passwords do not match');
                return;
            }

            try {
                const response = await fetch('api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    throw new Error('Signup failed');
                }

                const data = await response.json();
                currentUser = { name: data.user.name, email: data.user.email };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('token', data.token);
                updateUIForUser(data.user);
            } catch (error) {
                showError('signup-email', 'Signup failed. Please check your information.');
                console.error('Signup error:', error);
            }
        });
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const email = shareEmail.value.trim();
            if (validateEmail(email)) {
                try {
                    await fetch('/tasks/share', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify({ email }),
                    });
                    shareEmail.value = '';
                    alert('Tasks shared successfully');
                } catch (error) {
                    console.error('Error sharing tasks:', error);
                }
            } else {
                alert('Invalid email address');
            }
        });
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme');
        });
    }

    if (navItems) {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter || e.target.parentElement.dataset.filter;
                if (filter) {
                    renderTasks(filter);
                    currentCategoryEl.textContent = filter.charAt(0).toUpperCase() + filter.slice(1);
                }
            });
        });
    }

    if (authTabs) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'));
                authForms.forEach(f => f.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });
    }

    checkExistingSession();
    checkUserSession();
    loadSharedTasks();
});
