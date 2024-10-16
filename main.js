import { createApp } from "https://cdn.jsdelivr.net/npm/vue@3.5.12/dist/vue.esm-browser.js";

let ids = 0;

class Tasklist {
  id;
  /** @type {Array<Task>} */
  tasks = [];
  name;
  created;
  updated;

  /**
   * @param {string} name
   */
  constructor(name) {
    const now = Date.now();
    this.id = `${now}-${ids++}`;
    this.created = now;
    this.updated = now;
    this.name = name;
  }
}

class Task {
  id;
  title;
  emoji;
  completed = false;
  created;
  updated;

  /**
   * @param {string} title
   */
  constructor(title) {
    const now = Date.now();
    this.id = `${now}-${ids++}`;
    this.created = now;
    this.updated = now;
    this.title = title;
    this.emoji = "";
  }
}

class State {
  /** @type {Array<Tasklist>} */
  lists;
  /** @type {string} */
  currentList;
  darkmode = false;
}

function saveState(state) {
  const v = JSON.stringify(state);
  localStorage.setItem("taskState", v);
}

function restoreState() {
  const v = localStorage.getItem("taskState");
  if (v) {
    const state = JSON.parse(v);
    return state;
  }
  const initialState = new State();
  const initialList = new Tasklist("Meine Liste");
  initialState.lists = [initialList];
  initialState.currentList = initialList.id;
  return initialState;
}

let emojis = [];

createApp({
  data() {
    const state = restoreState();
    return {
      state,
      newTask: "",
      newList: "",
    };
  },
  mounted() {
    this.$refs.newTaskEl.focus();
    this.loadEmojis();
    document.body.dataset.bsTheme = this.state.darkmode ? "dark" : "light";
  },
  computed: {
    selectedList() {
      return this.state.lists.find((l) => l.id == this.state.currentList);
    },
    currentTasks() {
      return this.selectedList.tasks.toSorted((left, right) => {
        if (left.completed === right.completed) {
          return right.updated - left.updated;
        }
        if (left.completed) {
          return 1;
        }
        return -1;
      });
    },
    hasCompletedTasks() {
      return this.currentTasks.find((t) => t.completed) != null;
    },
  },
  watch: {
    state: {
      handler() {
        saveState(this.state);
      },
      deep: true,
    },
  },
  methods: {
    loadEmojis() {
      fetch(
        "https://cdn.jsdelivr.net/npm/@kazvmoe-infra/unicode-emoji-json@0.4.0/annotations/de.json"
      )
        .then((resp) => resp.json())
        .then((json) => {
          Object.entries(json).forEach(([symbol, v]) => {
            const keywords = v.keywords.map((k) => k.toLowerCase());
            emojis.push({
              symbol,
              keywords,
              name: v.name,
            });
          });
        });
    },
    addList() {
      if (!this.newList) {
        return;
      }
      const newList = new Tasklist(this.newList);
      this.state.lists.push(newList);
      this.state.currentList = newList.id;
      this.newList = "";
    },
    addTask() {
      if (!this.newTask) {
        return;
      }
      const task = new Task(this.newTask);

      const matchingEmojis = emojis.filter((e) =>
        e.keywords.includes(this.newTask.toLowerCase())
      );
      if (matchingEmojis.length > 0) {
        task.emoji =
          matchingEmojis[
            Math.floor(Math.random() * matchingEmojis.length)
          ].symbol;
      }

      this.selectedList.tasks.push(task);
      this.newTask = "";
    },
    removeTask(task) {
      this.selectedList.tasks = this.selectedList.tasks.filter(
        (t) => t.id != task.id
      );
    },
    toggleCompleted(task) {
      task.completed = !task.completed;
      task.updated = new Date();
    },
    removeCompletedTasks() {
      this.selectedList.tasks = this.selectedList.tasks.filter(
        (t) => !t.completed
      );
    },
    toggleDarkmode() {
      this.state.darkmode = !this.state.darkmode;
      document.body.dataset.bsTheme = this.state.darkmode ? "dark" : "light";
    },
  },
}).mount("#app");
