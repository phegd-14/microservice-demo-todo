
# Todo app that is build using Microservices

This project is a simple **microservices setup** with:
- **User Service** → Handles authentication (JWT).
- **Task Service** → Manages tasks (CRUD).
- **Deadline Service** → Allows setting deadlines for tasks.
- **Frontend (React)** → Simple UI to interact with the services.

---

## 🚀 Running the Project

### 1. Clone the Repo

You can clone the repo witht the following code.  

```bash
git clone https://github.com/phegd-14/microservice-demo-todo
cd microservice-demo-todo
```

---

### 2. Run Backend Services

Each service has its own folder (user-service, task-service, deadline-service).
Install Dependencies
Inside each service folder:

```bash
npm install
npm start
```

---

### 3. Run Frontend(React)
```bash
cd frontend
npm install
npm run dev
```

---

### Note

> Make sure all 3 services are running before starting the frontend.  
> JWT secret (supersecret) must be the same across services.  
> SQLite DB files will be auto-created in each service folder.  
this edit is to create a pr to main
this is a new feature
this is a new hotfix