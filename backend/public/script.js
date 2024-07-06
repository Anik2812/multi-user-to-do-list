document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
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

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/auth0';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }

    async function checkUserSession() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');
    
            const response = await fetch('/api/user', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const responseText = await response.text();
            console.log('Server response:', responseText); // Log the response text for debugging
    
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const data = JSON.parse(responseText);
                    updateUIForUser(data.user);
                } catch (jsonError) {
                    throw new Error('Error parsing JSON response: ' + jsonError.message);
                }
            } else {
                throw new Error('Unexpected content type');
            }
        } catch (error) {
            console.error('Error checking user session:', error);
            updateUIForUser(null);
        }
    }
    

    async function loadTasks() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tasks', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

    function renderTasks() {
        taskList.innerHTML = '';
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;

        totalTasksEl.textContent = `Total Tasks: ${totalTasks}`;
        completedTasksEl.textContent = `Completed Tasks: ${completedTasks}`;

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.text;
            if (task.completed) {
                li.classList.add('completed');
            }
            li.addEventListener('click', () => {
                toggleTaskCompletion(task._id);
            });
            taskList.appendChild(li);
        });
    }

    async function toggleTaskCompletion(taskId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ completed: true })
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            await loadTasks();
        } catch (error) {
            console.error('Error toggling task completion:', error);
        }
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const taskText = taskInput.value.trim();

            if (!taskText) {
                alert('Please enter a task.');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text: taskText })
                });

                if (!response.ok) {
                    throw new Error('Failed to add task');
                }

                taskInput.value = '';
                await loadTasks();
            } catch (error) {
                console.error('Error adding task:', error);
            }
        });
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-theme', e.target.checked);
        });
    }

    if (navItems) {
        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                const category = item.getAttribute('data-category');
                currentCategoryEl.textContent = category;
            });
        });
    }

    if (authTabs) {
        authTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const targetFormId = tab.getAttribute('data-target');
                authForms.forEach((form) => {
                    if (form.id === targetFormId) {
                        form.style.display = 'block';
                    } else {
                        form.style.display = 'none';
                    }
                });
            });
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = shareEmail.value.trim();

            if (!validateEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/share', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    throw new Error('Failed to share task');
                }

                shareEmail.value = '';
                alert('Task shared successfully!');
            } catch (error) {
                console.error('Error sharing task:', error);
            }
        });
    }

    // Initial check for user session
    checkUserSession();
    checkExistingSession();
});
