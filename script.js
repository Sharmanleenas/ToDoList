let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";
let editIndex = -1;

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add or update task
function addOrUpdateTask() {
  const textInput = document.getElementById("taskInput");
  const dueDateInput = document.getElementById("dueDateInput");
  const prioritySelect = document.getElementById("prioritySelect");
  const categorySelect = document.getElementById("categorySelect");

  const text = textInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = prioritySelect.value;
  const category = categorySelect.value;

  if (!text) {
    alert("Task text cannot be empty");
    return;
  }

  if (editIndex >= 0) {
    // Update existing task
    tasks[editIndex].text = text;
    tasks[editIndex].dueDate = dueDate;
    tasks[editIndex].priority = priority;
    tasks[editIndex].category = category;
    editIndex = -1;
    document.getElementById("cancelEditBtn").style.display = "none";
  } else {
    // Add new task
    tasks.push({
      text,
      dueDate,
      priority,
      category,
      completed: false,
      finishedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  textInput.value = "";
  dueDateInput.value = "";
  prioritySelect.value = "low";
  categorySelect.value = "general";

  saveTasks();
  renderTasks();
}

// Cancel editing
function cancelEdit() {
  editIndex = -1;
  document.getElementById("taskInput").value = "";
  document.getElementById("dueDateInput").value = "";
  document.getElementById("prioritySelect").value = "low";
  document.getElementById("categorySelect").value = "general";
  document.getElementById("cancelEditBtn").style.display = "none";
}

// Start editing a task
function editTask(index) {
  const task = tasks[index];
  document.getElementById("taskInput").value = task.text;
  document.getElementById("dueDateInput").value = task.dueDate || "";
  document.getElementById("prioritySelect").value = task.priority;
  document.getElementById("categorySelect").value = task.category || "general";
  editIndex = index;
  document.getElementById("cancelEditBtn").style.display = "inline-block";
}

// Toggle complete task
function toggleComplete(index) {
  const task = tasks[index];
  task.completed = !task.completed;
  task.finishedAt = task.completed ? new Date().toISOString() : null;
  saveTasks();
  renderTasks();
}

// Delete task
function deleteTask(index) {
  if (confirm("Delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

// Filter tasks
function setFilter(value) {
  filter = value;
  renderTasks();
}

// Render the list of tasks
function renderTasks() {
  const taskList = document.getElementById("taskList");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const sortType = document.getElementById("sortSelect").value;

  taskList.innerHTML = "";

  const today = new Date().toISOString().split("T")[0];

  let filtered = tasks.filter((task) => {
    // Filter by status
    if (filter === "completed" && !task.completed) return false;
    if (filter === "pending" && task.completed) return false;
    if (
      filter === "overdue" &&
      (!task.dueDate || task.dueDate >= today || task.completed)
    )
      return false;
    // Filter by search text
    if (search && !task.text.toLowerCase().includes(search)) return false;
    return true;
  });

  // Sort tasks
  filtered.sort((a, b) => {
    if (sortType === "priority") {
      const pMap = { high: 0, medium: 1, low: 2 };
      return pMap[a.priority] - pMap[b.priority];
    }
    if (sortType === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortType === "finishedAt") {
      if (!a.finishedAt) return 1;
      if (!b.finishedAt) return -1;
      return new Date(b.finishedAt) - new Date(a.finishedAt);
    }
    // Default sort by creation date descending
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  filtered.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = `priority-${task.priority} ${
      task.completed ? "completed" : ""
    }`;
    if (task.dueDate && task.dueDate < today && !task.completed) {
      li.classList.add("overdue");
    }
    li.draggable = true;

    // Drag and drop handlers
    li.addEventListener("dragstart", (e) => {
      li.classList.add("dragging");
      e.dataTransfer.setData("text/plain", index);
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    // Task main text and info
    let finishedTimeStr = "";
    if (task.finishedAt) {
      finishedTimeStr = ` (Finished: ${new Date(
        task.finishedAt
      ).toLocaleString()})`;
    }

    li.innerHTML = `
      <div style="flex-grow:1; cursor:pointer;">
        <input type="checkbox" ${
          task.completed ? "checked" : ""
        } onclick="toggleComplete(${index})" />
        <strong>${task.text}</strong> [${task.category}]<br/>
        Due: ${task.dueDate || "None"} | Priority: ${
      task.priority
    }${finishedTimeStr}
      </div>
      <div class="task-buttons">
        <button class="edit-btn" onclick="editTask(${index})">Edit</button>
        <button onclick="deleteTask(${index})">Delete</button>
      </div>
    `;

    taskList.appendChild(li);
  });

  updateAnalytics();
}

// Update Analytics
function updateAnalytics() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.filter((t) => !t.completed).length;
  const today = new Date().toISOString().split("T")[0];
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && !t.completed
  ).length;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("overdueTasks").textContent = overdue;
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// Drag and drop logic for reordering
const taskList = document.getElementById("taskList");
taskList.addEventListener("dragover", (e) => {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(taskList, e.clientY);
  if (afterElement == null) {
    taskList.appendChild(dragging);
  } else {
    taskList.insertBefore(dragging, afterElement);
  }
});

taskList.addEventListener("drop", (e) => {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  dragging.classList.remove("dragging");

  // Rebuild tasks order from DOM elements
  const newTasksOrder = [];
  [...taskList.children].forEach((li) => {
    const text = li.querySelector("strong").textContent;
    const task = tasks.find((t) => t.text === text);
    if (task) newTasksOrder.push(task);
  });
  tasks = newTasksOrder;
  saveTasks();
  renderTasks();
});

// Helper for drag and drop to find element after cursor
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll("li:not(.dragging)"),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Initialize
renderTasks();
