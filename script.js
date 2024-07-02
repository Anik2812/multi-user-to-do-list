const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
});

function addTask(task) {
    const li = document.createElement('li');
    li.innerHTML = `
        ${task}
        <button class="delete-btn" onclick="deleteTask(this)">Delete</button>
    `;
    todoList.appendChild(li);
}

function deleteTask(btn) {
    btn.parentNode.remove();
}