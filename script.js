document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('todo-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('todo-list');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const themeSwitch = document.getElementById('theme-switch');
    const navItems = document.querySelectorAll('nav ul li');
    const currentCategoryEl = document.querySelector('h2');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
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

    // Initial rendering of tasks
    renderTasks();
});

