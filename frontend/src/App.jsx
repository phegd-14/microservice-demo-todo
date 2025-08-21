import { useState, useEffect } from "react";
import "./app.css";

const USER_API = "http://localhost:4000";
const TASK_API = "http://localhost:5000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Fetch tasks after login
  useEffect(() => {
    if (token) {
      fetch(`${TASK_API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setTasks(data))
        .catch(console.error);
    }
  }, [token]);

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
    const res = await fetch(`${TASK_API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description: newTask }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert("Failed to add task: " + (err.error || res.status));
      return;
    }
    const task = await res.json();
    setTasks([...tasks, task]);
    setNewTask("");
  };

  const toggleDone = async (task) => {
    const updated = { description: task.description, done: task.done ? 0 : 1 };
    await fetch(`${TASK_API}/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updated),
    });
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
  };

  const deleteTask = async (id) => {
    await fetch(`${TASK_API}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditValue(task.description);
  };

  const saveEdit = async (id) => {
    const updated = { description: editValue, done: tasks.find(t => t.id === id).done };
    await fetch(`${TASK_API}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updated),
    });
    setTasks(tasks.map((t) => (t.id === id ? { ...t, description: editValue } : t)));
    setEditingTask(null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
  };

  return (
    <div className="app-container">
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
