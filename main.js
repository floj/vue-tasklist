import { createApp } from "https://cdn.jsdelivr.net/npm/vue@3.5.12/dist/vue.esm-browser.js";

function loadLists() {
  const v = localStorage.getItem("lists");
  if (!v) {
    return [{ name: "Meine Liste", selected: true }];
  }
  return JSON.parse(v);
}

function saveLists(lists) {
  const v = JSON.stringify(lists);
  localStorage.setItem("lists", v);
}

function loadTasks(listName) {
  if (!listName) {
    return [];
  }
  const v = localStorage.getItem(`list-${listName}`);
  if (!v) {
    return [];
  }
  const tasks = JSON.parse(v);
  tasks.forEach((t) => {
    t.created = new Date(t.created);
    t.updated = new Date(t.updated);
  });
  return tasks;
}

function saveTasks(listName, tasks) {
  const v = JSON.stringify(tasks);
  localStorage.setItem(`list-${listName}`, v);
}

let ids = 0;
createApp({
  data() {
    const lists = loadLists();
    const currentList = lists.find((l) => l.selected)?.name;
    const tasks = loadTasks(currentList);
    return {
      lists,
      tasks,
      newTask: "",
      newList: "",
    };
  },
  mounted() {
    this.$refs.newTaskEl.focus();
  },
  computed: {
    currentList() {
      return this.lists.find((l) => l.selected).name;
    },
    allTasks() {
      return this.tasks.toSorted((left, right) => {
        if (left.completed && !right.completed) {
          return 1;
        }
        if (!left.completed && right.completed) {
          return -1;
        }
        // else order by last updated first
        return right.updated.getTime() - left.updated.getTime();
      });
    },
  },
  watch: {
    tasks: {
      handler() {
        saveTasks(this.currentList, this.tasks);
      },
      deep: true,
    },
  },
  methods: {
    toggleCompleted(task) {
      task.completed = !task.completed;
      task.updated = new Date();
    },
    addTask() {
      if (!this.newTask) {
        return;
      }
      const now = new Date();
      this.tasks.push({
        name: this.newTask,
        completed: false,
        id: `${now.getTime()}-${ids++}`,
        created: now,
        updated: now,
      });
      this.newTask = "";
    },
    removeTask(task) {
      this.tasks = this.tasks.filter((t) => t.id != task.id);
    },
    addList() {
      if (!this.newList) {
        return;
      }
      this.lists.forEach((l) => (l.selected = false));
      this.lists.push({
        name: this.newList,
        selected: true,
      });

      saveLists(this.lists);

      this.tasks = loadTasks(this.newList);
      this.newList = "";
    },
    changeList(listName) {
      this.lists.forEach((l) => (l.selected = l.name == listName));
      this.tasks = loadTasks(listName);
      saveLists(this.lists);
    },
  },
}).mount("#app");
