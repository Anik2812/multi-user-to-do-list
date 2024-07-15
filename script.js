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
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const userAvatar = document.getElementById('user-avatar');

    loadTasks();

    let currentUser = null;
    let tasks = [];
    
    function checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            currentUser = JSON.parse(savedUser);
            updateUIForUser(currentUser);
            checkUserSession();
            loadSharedTasks();
        } else {
            updateUIForUser(null);
        }
    }

    async function handleForgotPassword() {
        const email = prompt("Please enter your email address:");
        if (email) {
            try {
                const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    alert('Password reset instructions have been sent to your email.');
                } else {
                    throw new Error(data.message || 'Failed to process forgot password request');
                }
            } catch (error) {
                console.error('Forgot password error:', error);
                alert(error.message);
            }
        }
    }
    
    async function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);
    
            try {
                const response = await fetch('http://localhost:5000/api/auth/avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: formData,
                });
    
                const data = await response.json();
    
                if (response.ok) {
                    userAvatar.src = `http://localhost:5000${data.avatarUrl}`;
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
    
    async function loadTasks() {
        try {
            const response = await fetch('http://localhost:5000/api/tasks', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to load tasks');
            }
    
            const fetchedTasks = await response.json();
            tasks = fetchedTasks;
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
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
            currentUserSpan.textContent = '';
            usernameSpan.textContent = '';
        }
    }

    const checkUserSession = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, user not logged in');
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/api/auth/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error checking user session:', error);
        }
    };
    
    const loadSharedTasks = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, user not logged in');
            return;
        }
        try {
            const response = await fetch('http://localhost:5000/api/tasks/shared', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });            
            if (!response.ok) {
                throw new Error('Failed to load shared tasks');
            }
            const tasks = await response.json();
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
        const totalTasksEl = document.getElementById('total-tasks');
        const completedTasksEl = document.getElementById('completed-tasks');
    
        if (totalTasksEl && completedTasksEl) {
            totalTasksEl.textContent = tasks.length;
            completedTasksEl.textContent = tasks.filter(task => task[5] === 'true').length;
        }
    }

    async function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            try {
                const response = await fetch('http://localhost:5000/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ title: text, description: text })
                });
    
                if (!response.ok) {
                    throw new Error('Failed to add task');
                }
    
                const newTask = await response.json();
                tasks.push(newTask);
                taskInput.value = '';
                renderTasks();
            } catch (error) {
                console.error('Error adding task:', error);
            }
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
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
    
                const data = await response.json();
                console.log('Server response:', data);
    
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
    
                localStorage.setItem('token', data.token);
                currentUser = { name: data.user.name, email: data.user.email };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForUser(data.user);
                updateUIForUser(currentUser);
            } catch (error) {
                console.error('Login error:', error);
                showError('login-email', error.message || 'Login failed. Please check your credentials.');
            }
        });
    }
    
    if (signupSubmit) {
        signupSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('signup-name');
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
    
            if (!nameInput) console.error('signup-name input not found');
            if (!emailInput) console.error('signup-email input not found');
            if (!passwordInput) console.error('signup-password input not found');
    
            const name = nameInput ? nameInput.value : '';
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
    
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
                showError('signup-password', 'Password must be at least 8 characters long and include at least one number, one uppercase letter, and one lowercase letter');
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
    
                const data = await response.json();
                console.log('Server response:', data);
    
                if (!response.ok) {
                    throw new Error(data.message || 'Signup failed');
                }
    
                localStorage.setItem('token', data.token);
                currentUser = { name: data.user.name, email: data.user.email };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForUser(currentUser);
            } catch (error) {
                console.error('Signup error:', error);
                showError('signup-email', error.message || 'Signup failed. Please check your information.');
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

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }

    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarUpload.click();
        });
    }

    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            updateUIForUser(null);
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            const category = item.dataset.category;
            renderTasks(category);
        });
    });

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
    
            tab.classList.add('active');
            const targetForm = document.getElementById(`${tab.dataset.tab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    checkExistingSession();
});
