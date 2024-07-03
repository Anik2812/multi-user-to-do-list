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
    const Sharebtn = document.getElementById('Share-btn');
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

    loginSubmit.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        // Here you would typically send a request to your backend to authenticate
        // For now, we'll just simulate a successful login
        currentUser = { name: email.split('@')[0], email: email };
        updateUIForUser();
    });

    signupSubmit.addEventListener('click', () => {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        // Here you would typically send a request to your backend to create a new user
        // For now, we'll just simulate a successful signup
        currentUser = { name: name, email: email };
        updateUIForUser();
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        updateUIForUser();
    });

    Sharebtn.addEventListener('click', () => {
        const email = shareEmail.value;
        // Here you would typically send a request to your backend to share the task list
        alert(`Task list shared with ${email}`);
        shareEmail.value = '';
    });

    function loadTasks() {
        // Here you would typically send a request to your backend to get the user's tasks
        // For now, we'll just simulate loading some tasks
        tasks = [
            { text: "User's task 1", completed: false, important: false },
            { text: "User's task 2", completed: true, important: true },
        ];
        renderTasks();
    }

    function saveTasks() {
        // Here you would typically send a request to your backend to save the tasks
        // For now, we'll just log the tasks to the console
        console.log('Saving tasks:', tasks);
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
            const targetForm = tab.getAttribute('data-tab');
            
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetForm}-form`).classList.add('active');
        });
    });

    // Initial setup
    updateUIForUser();
});