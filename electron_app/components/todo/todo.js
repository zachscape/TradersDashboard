var dragSrcEl = null;

function loadTodos(todoList, addTodoToList) {
  var todos = JSON.parse(localStorage.getItem('todos')) || [];
  todos.forEach(function(todo) {
    addTodoToList({ text: todo.text }, todoList);
  });
}

function saveTodos(todoList) {
  var todos = Array.from(todoList.children).map(function(li, index) {
    return {
      text: li.querySelector('span').textContent,
      order: index
    };
  });
  localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodoToList(todo, todoList) {
  var listItem = document.createElement('li');
  listItem.draggable = true;

  listItem.addEventListener('dragstart', handleDragStart, false);
  listItem.addEventListener('dragover', handleDragOver, false);
  listItem.addEventListener('dragend', handleDragEnd, false);
  listItem.addEventListener('drop', handleDrop, false);

  var deleteButton = document.createElement('button');
  deleteButton.textContent = 'X';
  deleteButton.className = 'delete-btn';

  var todoText = document.createElement('span');
  todoText.textContent = typeof todo === 'string' ? todo : todo.text;
  todoText.style.paddingRight = '10px'; 

  listItem.appendChild(deleteButton); 
  listItem.appendChild(todoText);

  todoList.appendChild(listItem);
}
function handleDragStart(e) {
  this.style.opacity = '0.4';
  dragSrcEl = this;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = 'move';

  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';

  Array.from(this.parentNode.children).forEach(function (item) {
    item.classList.remove('over');
  });
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (dragSrcEl != this) {
    this.parentNode.insertBefore(dragSrcEl, this.nextSibling);

    Array.from(this.parentNode.children).forEach(function(li, index) {
      li.order = index;
    });

    saveTodos(this.parentNode);
  }

  return false;
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('delete-btn')) {
    var todoList = e.target.parentNode.parentNode;
    var listItem = e.target.parentNode;
    todoList.removeChild(listItem);
    saveTodos(todoList);
  }
});

module.exports = {
  loadTodos: loadTodos,
  saveTodos: saveTodos,
  addTodoToList: addTodoToList
};