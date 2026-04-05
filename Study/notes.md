# Windows Setup Guide

Complete guide to set up and run this project on Windows.

---

## What Needs to Be Installed

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | v20 LTS | Runs all backend services |
| **npm** | comes with Node | Package manager |
| **Git** | latest | Clone/manage code |
| **Redis** | via WSL or Docker | Required for BullMQ queues |
| **PostgreSQL** | 14+ | Database (or use the remote DB already in .env) |

---

## Option A — Docker (Recommended, Easiest)

### Step 1: Install Docker Desktop

Download from https://www.docker.com/products/docker-desktop and enable **WSL 2 backend** when prompted.

### Step 2: Open terminal in project folder

```cmd
cd path\to\CRM
```

### Step 3: Copy all .env files

```cmd
copy projects\seller-management-system\auth\.env.example projects\seller-management-system\auth\.env
copy projects\seller-management-system\service-master\.env.example projects\seller-management-system\service-master\.env
copy projects\seller-management-system\client\.env.example projects\seller-management-system\client\.env.local

copy projects\supplier-management-system\usa-auth\.env.example projects\supplier-management-system\usa-auth\.env
copy projects\supplier-management-system\usa-service-master\.env.example projects\supplier-management-system\usa-service-master\.env
copy projects\supplier-management-system\usa-client\.env.example projects\supplier-management-system\usa-client\.env.local

copy projects\notification-service\.env.example projects\notification-service\.env
```

### Step 4: Start everything

```cmd
docker-compose up -d
```

Done. Access at:
- Seller Frontend → http://localhost:3001
- Supplier Frontend → http://localhost:3003

---

## Option B — Manual (Without Docker)

### 1. Install Node.js

Download **Node.js v20 LTS** from https://nodejs.org

Verify installation:

```cmd
node -v
npm -v
```

### 2. Install Redis on Windows

Redis does not run natively on Windows. Use one of these:

**Option 1 — WSL2 (recommended):**

```cmd
wsl --install
```

Then inside WSL terminal:

```bash
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
```

**Option 2 — Docker just for Redis:**

```cmd
docker run -d -p 6379:6379 --name redis redis:alpine
```

### 3. Install root dependencies

This step is critical — the `auth` service depends on `"admincrm": "file:../.."` which points to this root folder.

```cmd
cd CRM
npm install
```

### 4. Install each service

Run these one by one:

```cmd
cd projects\seller-management-system\auth
npm install

cd ..\service-master
npm install

cd ..\client
npm install

cd ..\..\supplier-management-system\usa-auth
npm install

cd ..\usa-service-master
npm install

cd ..\usa-client
npm install

cd ..\..\..\notification-service
npm install
```

### 5. Copy .env files

```cmd
copy projects\seller-management-system\auth\.env.example projects\seller-management-system\auth\.env
copy projects\seller-management-system\service-master\.env.example projects\seller-management-system\service-master\.env
copy projects\seller-management-system\client\.env.example projects\seller-management-system\client\.env.local

copy projects\supplier-management-system\usa-auth\.env.example projects\supplier-management-system\usa-auth\.env
copy projects\supplier-management-system\usa-service-master\.env.example projects\supplier-management-system\usa-service-master\.env
copy projects\supplier-management-system\usa-client\.env.example projects\supplier-management-system\usa-client\.env.local

copy projects\notification-service\.env.example projects\notification-service\.env
```

### 6. Run services

Open a **separate terminal** for each service:

**Terminal 1 — Seller Auth:**
```cmd
cd CRM\projects\seller-management-system\auth
npm run dev
```

**Terminal 2 — Seller Service:**
```cmd
cd CRM\projects\seller-management-system\service-master
npm run dev
```

**Terminal 3 — Seller Client (Frontend):**
```cmd
cd CRM\projects\seller-management-system\client
npm run dev
```

**Terminal 4 — Supplier Auth:**
```cmd
cd CRM\projects\supplier-management-system\usa-auth
npm run dev
```

**Terminal 5 — Supplier Service:**
```cmd
cd CRM\projects\supplier-management-system\usa-service-master
npm run dev
```

**Terminal 6 — Supplier Client:**
```cmd
cd CRM\projects\supplier-management-system\usa-client
npm run dev
```

**Terminal 7 — Notification Service:**
```cmd
cd CRM\projects\notification-service
npm run dev
```

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Seller Auth API | 3000 | http://localhost:3000 |
| Seller Frontend | 3001 | http://localhost:3001 |
| Seller Service API | 3002 | http://localhost:3002 |
| Supplier Frontend | 3003 | http://localhost:3003 |
| Supplier Service API | 3004 | http://localhost:3004 |
| Supplier Auth API | 3005 | http://localhost:3005 |
| Notification Service | 4000 | http://localhost:4000 |

---

## Common Windows Problems

### Problem: `npm install` fails on `bcrypt`

Install build tools:

```cmd
npm install --global windows-build-tools
```

Or install **Visual Studio Build Tools** from Microsoft (select "Desktop development with C++").

### Problem: `ENOENT` or path errors

Use **cmd** or **PowerShell**, not Git Bash, for Windows paths.

### Problem: Redis connection refused

Redis is not running. Start it via WSL:

```bash
sudo service redis-server start
```

Or via Docker:

```cmd
docker start redis
```

### Problem: Port already in use

Find and kill the process using the port:

```cmd
netstat -ano | findstr :3001
taskkill /PID <pid_number> /F
```

### Problem: `installmodule.sh` won't run

That shell script is for Mac/Linux only. On Windows, run `npm install` manually in each folder as shown in Step 4 above.

### Problem: `make` command not found

The `Makefile` commands do not work on Windows natively. Either:
- Use **Docker** (Option A) which handles everything, or
- Run commands manually as shown in Option B

---

## Notes

- The `.env.example` files already contain the **remote database credentials** — you do **not** need to set up PostgreSQL locally.
- You only need **Redis running locally** (port 6379).
- The `client` folder uses **Next.js 15** — use `.env.local` not `.env.production` for local development.
