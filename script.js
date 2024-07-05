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

    async function loginUser(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                currentUser = data.user;
                updateUIForUser();
            } else {
                const errorData = await response.json();
                alert(errorData.error);
            }
        } catch (error) {
            alert('An error occurred while logging in.');
        }
    }

    async function signupUser(name, email, password) {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                alert('Signup successful! You can now log in.');
                document.querySelector('.auth-tab[data-tab="login"]').click();
            } else {
                const errorData = await response.json();
                alert(errorData.error);
            }
        } catch (error) {
            alert('An error occurred while signing up.');
        }
    }

    async function shareTaskList(email) {
        try {
            const response = await fetch('/api/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                alert(`Task list shared with ${email}`);
            } else {
                const errorData = await response.json();
                alert(errorData.error);
            }
        } catch (error) {
            alert('An error occurred while sharing the task list.');
        }
    }

    async function loadTasks() {
        try {
            const response = await fetch('/api/tasks', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            if (response.ok) {
                tasks = await response.json();
                renderTasks();
            } else {
                alert('Failed to load tasks.');
            }
        } catch (error) {
            alert('An error occurred while loading tasks.');
        }
    }

    async function saveTasks() {
        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify(tasks)
            });
        } catch (error) {
            alert('An error occurred while saving tasks.');
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

        updateTaskCounts();
    }

    function updateTaskCounts() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;

        totalTasksEl.textContent = `Total tasks: ${totalTasks}`;
        completedTasksEl.textContent = `Completed tasks: ${completedTasks}`;
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text: text, completed: false, important: false });
            taskInput.value = '';
            renderTasks();
            saveTasks();
        }
    }

    async function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        await fetch(`/api/tasks/${tasks[index]._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ completed: tasks[index].completed })
        });
        renderTasks();
    }

    async function toggleImportant(index) {
        tasks[index].important = !tasks[index].important;
        await fetch(`/api/tasks/${tasks[index]._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ important: tasks[index].important })
        });
        renderTasks();
    }

    async function editTask(index) {
        const newText = prompt('Edit task:', tasks[index].text);
        if (newText !== null) {
            tasks[index].text = newText;
            await fetch(`/api/tasks/${tasks[index]._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ text: newText })
            });
            renderTasks();
        }
    }

    async function deleteTask(index) {
        await fetch(`/api/tasks/${tasks[index]._id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            }
        });
        tasks.splice(index, 1);
        renderTasks();
    }

    // Event listeners

    loginSubmit.addEventListener('click', () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (email === '' || password === '') {
            alert('Please enter both email and password.');
            return;
        }

        loginUser(email, password);
    });

    signupSubmit.addEventListener('click', () => {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();

        if (name === '' || email === '' || password === '') {
            alert('Please fill in all fields.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        signupUser(name, email, password);
    });

    shareBtn.addEventListener('click', () => {
        const email = shareEmail.value.trim();

        if (email === '') {
            alert('Please enter an email address to share with.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        shareTaskList(email);
    });

    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            navItems.forEach(el => el.classList.remove('active'));
            event.target.classList.add('active');
            const filter = event.target.dataset.filter;
            renderTasks(filter);
            currentCategoryEl.textContent = `Tasks (${filter})`;
        });
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        currentUser = null;
        updateUIForUser();
    });

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            authForms.forEach(form => {
                form.style.display = form.dataset.form === targetTab ? 'block' : 'none';
            });
            authTabs.forEach(tab => {
                tab.classList.remove('active');
            });
            tab.classList.add('active');
        });
    });

    // Load saved theme from localStorage
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeSwitch.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
        themeSwitch.checked = false;
    }

    updateUIForUser();
});
