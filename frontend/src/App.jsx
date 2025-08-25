import { useState, useEffect } from "react";
import "./App.css";
import "./index.css";

// e.g. src/config.js
const USER_API = "http://localhost:4000"; 
const TASK_API = "http://localhost:5000";
const DEADLINE_API = "http://localhost:6001";

function App() {
  const [darkMode, setDarkMode] = useState(true); // default dark
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newDeadline, setNewDeadline] = useState(""); // deadline input
  const [editingTask, setEditingTask] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // unified fetch wrapper with token + expiry handling
  const authFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 403) {
      alert("Session expired, please login again.");
      logout();
      return null;
    }
    return res;
  };

  // Fetch tasks + deadlines after login
  useEffect(() => {
    if (token) {
      authFetch(`${TASK_API}/tasks`)
        .then((res) => res && res.json())
        .then(async (data) => {
          if (!Array.isArray(data)) return;
          // Fetch deadlines
          const res = await authFetch(`${DEADLINE_API}/deadlines`);
          const deadlines = res ? await res.json() : [];
          // merge tasks with deadlines
          const merged = data.map((task) => {
            const dl = deadlines.find((d) => d.taskId === task.id);
            return { ...task, deadline: dl ? dl.deadline : null };
          });
          setTasks(merged);
        })
        .catch(console.error);
    }
  }, [token]);

   useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const login = async () => {
    const res = await fetch(`${USER_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } else {
      alert("Login failed");
    }
  };

  const signup = async () => {
    await fetch(`${USER_API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    alert("User registered! Please login.");
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const res = await authFetch(`${TASK_API}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newTask }),
    });
    if (!res) return;
    if (!res.ok) {
      const err = await res.json();
      alert("Failed to add task: " + (err.error || res.status));
      return;
    }
    const task = await res.json();

    // if deadline is set, add deadline entry
    let deadline = null;
    if (newDeadline) {
      const dlRes = await authFetch(`${DEADLINE_API}/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, deadline: newDeadline }),
      });
      if (dlRes && dlRes.ok) {
        const dlData = await dlRes.json();
        deadline = dlData.deadline;
      }
    }

    setTasks([...tasks, { ...task, deadline }]);
    setNewTask("");
    setNewDeadline("");
  };

  const toggleDone = async (task) => {
    const updated = { description: task.description, done: task.done ? 0 : 1 };
    await authFetch(`${TASK_API}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
  };

  const deleteTask = async (id) => {
    await authFetch(`${TASK_API}/tasks/${id}`, { method: "DELETE" });
    await authFetch(`${DEADLINE_API}/deadlines/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditValue(task.description);
    setEditDeadline(task.deadline || "");
  };

  const saveEdit = async (id) => {
    const updated = {
      description: editValue,
      done: tasks.find((t) => t.id === id).done,
    };
    await authFetch(`${TASK_API}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    // update deadline
    if (editDeadline) {
      await authFetch(`${DEADLINE_API}/deadlines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: editDeadline }),
      });
    }

    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, description: editValue, deadline: editDeadline } : t
      )
    );
    setEditingTask(null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
  };

  return (
    <div className="app-container">
      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>

      {!token ? (
        <div className="auth-box">
          <h2>Login / Signup</h2>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="btn-group">
            <button onClick={login}>Login</button>
            <button onClick={signup}>Signup</button>
          </div>
        </div>
      ) : (
        <div className="task-box">
          <div className="header">
            <h2>Your Tasks</h2>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>

          <div className="task-input">
            <input
              placeholder="New task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
            <button onClick={addTask}>Add</button>
          </div>

          <ul className="task-list">
            {tasks.map((t) => (
              <li key={t.id}>
                {editingTask === t.id ? (
                  <>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <input
                      type="date"
                      value={editDeadline || ""}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                    <button onClick={() => saveEdit(t.id)}>Save</button>
                    <button onClick={() => setEditingTask(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span
                      className={t.done ? "done" : ""}
                      onClick={() => toggleDone(t)}
                    >
                      {t.description}
                    </span>
                    {t.deadline && (
                      <small className="deadline"> (Due: {t.deadline})</small>
                    )}
                    <div className="task-actions">
                      <button onClick={() => startEdit(t)}>✏️</button>
                      <button onClick={() => deleteTask(t.id)}>❌</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
