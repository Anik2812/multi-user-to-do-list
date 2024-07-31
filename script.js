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
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserSpan = document.getElementById('current-user');
    const usernameSpan = document.getElementById('username');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const userAvatar = document.getElementById('user-avatar');

    let currentUser = null;
    let tasks = [];

    // Initialize EmailJS
    emailjs.init("UMB6X5QtDbAumwd1Vw3KQ");

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

    function updateUIForUser(user) {
        if (user) {
            currentUserSpan.textContent = user.name || 'Guest';
            userAvatar.src = user.avatar || 'default-avatar.png';
            appContainer.style.display = 'block';
            authContainer.style.display = 'none';
            usernameSpan.textContent = user.name;
        } else {
            appContainer.style.display = 'none';
            authContainer.style.display = 'block';
        }
    }

    async function loadTasks() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch('https://taskmasterpros.onrender.com/api/tasks', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load tasks');
            }

            tasks = await response.json();
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
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
            case 'shared':
                filteredTasks = tasks.filter(task => task.isShared);
                break;
        }
    
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} ${task.isShared ? 'shared' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${task.isShared ? 'disabled' : ''}>
                <span class="task-text">${task.title}</span>
                <div class="task-actions">
                    ${task.isShared ? '<span class="shared-indicator">Shared</span>' : ''}
                    <button class="important-btn ${task.important ? 'active' : ''}" ${task.isShared ? 'disabled' : ''}><i class="fas fa-star"></i></button>
                    <button class="edit-btn" ${task.isShared ? 'disabled' : ''}><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" ${task.isShared ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
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

    function updateTaskStats() {
        if (totalTasksEl && completedTasksEl) {
            totalTasksEl.textContent = tasks.length;
            completedTasksEl.textContent = tasks.filter(task => task.completed).length;
        }
    }

    async function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://taskmasterpros.onrender.com/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
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

    async function toggleTask(taskId) {
        try {
            const token = localStorage.getItem('token');
            const task = tasks.find(t => t._id === taskId);
            if (!task) throw new Error('Task not found');

            const response = await fetch(`https://taskmasterpros.onrender.com/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ completed: !task.completed })
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const updatedTask = await response.json();
            const taskIndex = tasks.findIndex(t => t._id === taskId);
            tasks[taskIndex] = updatedTask;
            renderTasks();
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }

    async function toggleImportant(taskId) {
        try {
            const token = localStorage.getItem('token');
            const task = tasks.find(t => t._id === taskId);
            if (!task) throw new Error('Task not found');

            const response = await fetch(`https://taskmasterpros.onrender.com/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ important: !task.important })
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const updatedTask = await response.json();
            const taskIndex = tasks.findIndex(t => t._id === taskId);
            tasks[taskIndex] = updatedTask;
            renderTasks();
        } catch (error) {
            console.error('Error toggling important:', error);
        }
    }

    async function editTask(taskId) {
        const task = tasks.find(t => t._id === taskId);
        if (task) {
            const newText = prompt('Edit task:', task.title);
            if (newText !== null && newText.trim() !== '') {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`https://taskmasterpros.onrender.com/api/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title: newText.trim() })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update task');
                    }

                    const updatedTask = await response.json();
                    const taskIndex = tasks.findIndex(t => t._id === taskId);
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
            const token = localStorage.getItem('token');
            const response = await fetch(`https://taskmasterpros.onrender.com/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            tasks = tasks.filter(t => t._id !== taskId);
            renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    async function shareTasks() {
        const email = shareEmail.value.trim();
        if (validateEmail(email)) {
            try {
                const token = localStorage.getItem('token');
                const taskIds = tasks.filter(task => !task.isShared).map(task => task._id);
                const response = await fetch('https://taskmasterpros.onrender.com/api/tasks/share', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email, taskIds })
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to share tasks');
                }
    
                alert('Tasks shared successfully');
                loadTasks(); // Refresh the task list
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Invalid email address');
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);

    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateUIForUser(null);
    });

    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt('Please enter your email address:');
        if (email && validateEmail(email)) {
            try {
                const response = await fetch('https://taskmasterpros.onrender.com/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    throw new Error('Failed to send reset email');
                }

                const data = await response.json();
                const resetToken = data.resetToken;

                // Send email using EmailJS
                await emailjs.send("service_qltnhtg", "template_1chnnmq", {
                    to_email: email,
                    reset_link: `http://localhost:8000/reset-password/${resetToken}`
                });

                alert('Password reset email sent. Please check your inbox.');
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Please enter a valid email address.');
        }
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

                const token = localStorage.getItem('token');
                const response = await fetch('https://taskmasterpros.onrender.com/api/auth/change-avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
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
            const filter = item.dataset.category;
            renderTasks(filter);
            currentCategoryEl.textContent = item.textContent;
        });
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

    if (loginSubmit) loginSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (email && password) {
            try {
                const response = await fetch('https://taskmasterpros.onrender.com/api/auth/login', {
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

    if (signupSubmit) {
        signupSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value.trim();

            if (name && email && password) {
                try {
                    const response = await fetch('https://taskmasterpros.onrender.com/api/auth/signup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name, email, password })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to sign up');
                    }

                    const data = await response.json();
                    alert('Sign up successful, please log in');
                    document.querySelector('[data-tab="login"]').click();  // Switch to the login tab
                } catch (error) {
                    alert(error.message);
                }
            } else {
                alert('Please fill in all fields');
            }
        });
    }

    checkExistingSession();
});
