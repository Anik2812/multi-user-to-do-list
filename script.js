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

    let currentUser = null;
    let tasks = [];

    // Check if the user has a session
    function checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            currentUser = JSON.parse(savedUser);
            updateUIForUser(currentUser);
            loadTasks();
        } else {
            updateUIForUser(null);
        }
    }

    // Update the UI based on the user's login state
    function updateUIForUser(user) {
        if (user) {
            currentUserSpan.textContent = user.username || 'Guest';
            userAvatar.src = user.avatarUrl || 'default-avatar.png';
            appContainer.style.display = 'block';
            authContainer.style.display = 'none';
            usernameSpan.textContent = user.username;
        } else {
            appContainer.style.display = 'none';
            authContainer.style.display = 'block';
        }
    }

    // Fetch tasks from the server
    async function loadTasks() {
        try {
            const response = await apiCall('GET', '/api/tasks');
            console.log('Received tasks:', response);
            tasks = response.map(task => ({
                ...task,
                _id: task._id || task[0], // Ensure ID is set correctly
                completed: task.completed === true || task.completed === 'true',
                important: task.important === true || task.important === 'true'
            }));
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            showError('Error loading tasks');
        }
    }

    function renderTasks(filter = 'all') {
        if (!taskList) {
            console.error('Task list element not found');
            return;
        }

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

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.title || 'Untitled Task'}</span>
            <div class="task-actions">
              <button class="important-btn ${task.important ? 'active' : ''}" data-id="${task._id}">
                <i class="fas fa-star"></i>
              </button>
              <button class="edit-btn" data-id="${task._id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-btn" data-id="${task._id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `;

            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(task._id));

            const importantBtn = li.querySelector('.important-btn');
            importantBtn.addEventListener('click', () => toggleImportant(task._id));

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editTask(task._id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task._id));

            taskList.appendChild(li);
        });

        updateTaskStats();
    }

    async function deleteTask(taskId) {
        if (!taskId) {
            console.error('Attempted to delete task with undefined ID');
            return;
        }
        try {
            await apiCall('DELETE', `/api/tasks/${taskId}`);
            tasks = tasks.filter(task => task._id !== taskId);
            renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            showError('Failed to delete task');
        }
    }

    // Update task statistics
    function updateTaskStats() {
        if (totalTasksEl && completedTasksEl) {
            totalTasksEl.textContent = tasks.length;
            completedTasksEl.textContent = tasks.filter(task => task.completed).length;
        }
    }

    // Add a new task
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

    // Toggle task completion
    async function toggleTask(taskId) {
        const task = tasks.find(t => t._id === taskId);
        if (task) {
            try {
                const updatedTask = await updateTaskOnServer(taskId, { completed: !task.completed });
                Object.assign(task, updatedTask);
                renderTasks();
            } catch (error) {
                console.error('Error toggling task:', error);
            }
        }
    }

    // Toggle task importance
    async function toggleImportant(taskId) {
        const task = tasks.find(t => t._id === taskId);
        if (task) {
            try {
                const updatedTask = await updateTaskOnServer(taskId, { important: !task.important });
                Object.assign(task, updatedTask);
                renderTasks();
            } catch (error) {
                console.error('Error toggling important:', error);
            }
        }
    }

    // Edit a task
    async function editTask(taskId) {
        const task = tasks.find(t => t._id === taskId);
        if (task) {
            const newText = prompt('Edit task:', task.title);
            if (newText !== null) {
                try {
                    const updatedTask = await updateTaskOnServer(taskId, { title: newText.trim() });
                    Object.assign(task, updatedTask);
                    renderTasks();
                } catch (error) {
                    console.error('Error editing task:', error);
                }
            }
        }
    }

    // Delete a task
    async function deleteTask(taskId) {
        if (!taskId) {
            console.error('Attempted to delete task with undefined ID');
            return;
        }
        try {
            await apiCall('DELETE', `/api/tasks/${taskId}`);
            tasks = tasks.filter(task => task._id !== taskId);
            renderTasks();
        } catch (error) {
            showError('Failed to delete task');
        }
    }

    // Update task on the server
    async function updateTaskOnServer(taskId, updates) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating task on server:', error);
        }
    }

    // Share tasks via email
    async function shareTasks() {
        const email = shareEmail.value.trim();
        if (validateEmail(email)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/tasks/share', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email, tasks })
                });

                if (!response.ok) {
                    throw new Error('Failed to share tasks');
                }

                alert('Tasks shared successfully');
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Invalid email address');
        }
    }

    // Validate email format
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Set up event listeners
    if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);

    if (loginBtn) loginBtn.addEventListener('click', () => {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    });

    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateUIForUser(null);
    });

    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', () => {
        alert('Forgot password feature is not implemented yet');
    });

    if (changeAvatarBtn) changeAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
    });

    if (avatarUpload) avatarUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('avatar', file);

                const response = await fetch('http://localhost:5000/api/auth/change-avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Failed to change avatar');
                }

                const data = await response.json();
                userAvatar.src = data.avatarUrl;
                currentUser.avatar = data.avatarUrl;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } catch (error) {
                alert(error.message);
            }
        }
    });

    if (themeSwitch) themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
    });

    if (shareBtn) shareBtn.addEventListener('click', shareTasks);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const filter = item.dataset.filter;
            renderTasks(filter);
            currentCategoryEl.textContent = item.textContent;
        });
    });

    if (loginSubmit) loginSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (email && password) {
            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    throw new Error('Invalid email or password');
                }

                const data = await response.json();
                localStorage.setItem('token', data.token);
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForUser(currentUser);
                loadTasks();
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Please enter both email and password');
        }
    });

    if (signupSubmit) signupSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const username = document.getElementById('signup-username').value.trim();

        if (email && password && username) {
            try {
                const response = await fetch('http://localhost:5000/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password, username })
                });

                if (!response.ok) {
                    throw new Error('Failed to sign up');
                }

                const data = await response.json();
                alert('Sign up successful, please log in');
                authTabs[0].click();  // Switch to the login tab
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Please fill in all fields');
        }
    });

    checkExistingSession();
});
