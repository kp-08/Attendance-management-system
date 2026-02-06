# Attendance,Phonebook & Leave Management System - Full Stack Integration

> **Complete full-stack application** for employee attendance, leave management, and phonebook functionality with modern tech stack and production-ready deployment.

**Frontend:** React 19 + Vite + TypeScript  
**Backend:** FastAPI + SQLAlchemy + PostgreSQL  
**Database:** PostgreSQL 15  
**Deployment:** Docker Compose with nginx reverse proxy  

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [Running the Application](#running-the-application)
5. [Development Workflow](#development-workflow)
6. [API Documentation](#api-documentation)
7. [Database & Migrations](#database--migrations)
8. [Testing](#testing)
9. [Docker Deployment](#docker-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Features](#features)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (v2.0+)
- Git
- (Optional) Node.js 18+ and Python 3.10+ for local development

### Option 1: Full Stack - Running the full application 

```bash
# 1. Clone and navigate to the repository
cd Intern-project-test

# 2. Set up environment variables
cp .env.example .env

# 3. Generate a secure secret key
openssl rand -hex 32
# Copy the output and add to .env as SECRET_KEY value

# 4. Start all services with Docker
docker compose up -d --build

# 5. Initialize the database
docker compose exec backend alembic upgrade head
docker compose exec backend python seed_data.py

```
# 6. Access the application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React SPA (served by nginx) |
| **Backend API** | http://localhost:8000 | FastAPI (direct access) |
| **API via Proxy** | http://localhost:3000/api/ | API through nginx proxy |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **pgAdmin** | http://localhost:8080 | Database admin (optional) |

### Option 2: Frontend Development(Frontend Dev Server + Docker Backend)

```bash
# Terminal 1: Start backend services
docker compose up db backend -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python seed_data.py

# Terminal 2: Start frontend dev server
cd frontend-only
npm install
npm run dev
# Frontend available at http://localhost:5173 (or as Vite displays)
```

### Default Test Credentials

After running `seed_data.py`:

```
Email:    admin@company.com
Password: admin123
```

---

## 📁 Project Structure

```
Intern-project-test/
│
├── backend/                      # FastAPI backend service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── auth.py              # JWT authentication logic
│   │   ├── config.py            # Application configuration
│   │   ├── database.py          # Database connection & session
│   │   ├── deps.py              # Dependency injection
│   │   ├── email_service.py     # Email notifications
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── employees.py     # Employee management
│   │   │   ├── attendance.py    # Attendance check-in/out
│   │   │   ├── leaves.py        # Leave management
│   │   │   ├── holidays.py      # Holiday management
│   │   │   ├── frontend_compat.py # Frontend compatibility layer
│   │   │   └── __init__.py
│   │   └── tests/               # Pytest test suite
│   │       ├── conftest.py      # Pytest fixtures & configuration
│   │       ├── test_auth.py
│   │       ├── test_employees.py
│   │       ├── test_attendance.py
│   │       ├── test_leaves.py
│   │       ├── test_pagination.py
│   │       └── test_sorting.py
│   │
│   ├── alembic/                 # Database migration tool
│   │   ├── env.py              # Alembic environment configuration
│   │   ├── script.py.mako      # Migration template
│   │   └── versions/           # Migration files
│   │       ├── 6e7a5d0c6bd2_initial.py
│   │       ├── 6c8dc8d04bd4_add_approval_status_to_attendance.py
│   │       ├── add_attendance_conformation.py
│   │       └── e7d293580976_add_manager_id_to_employees.py
│   │
│   ├── Dockerfile              # Backend container image
│   ├── requirements.txt         # Python dependencies
│   ├── alembic.ini            # Alembic configuration
│   ├── seed_data.py           # Initial data seeding script
│   ├── .env.example           # Environment template
│   ├── .env                   # Environment variables (git ignored)
│   ├── docker-compose.yml     # Backend-only compose (reference)
│   └── README.md              # Backend-specific documentation
│
├── frontend-only/              # React/Vite frontend application
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── index.tsx          # React entry point
│   │   ├── vite-env.d.ts      # Vite type definitions
│   │   ├── config/
│   │   │   └── api.ts         # API client configuration
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pages/             # Page components (routes)
│   │   │   ├── AdminMasterPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   ├── AttendancePage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LeavePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ManagerPage.tsx
│   │   │   └── PhonebookPage.tsx
│   │   ├── services/          # API service clients
│   │   │   ├── authService.ts
│   │   │   ├── attendanceService.ts
│   │   │   ├── leaveService.ts
│   │   │   ├── userService.ts
│   │   │   ├── holidayService.ts
│   │   │   └── index.ts
│   │   └── types/             # TypeScript type definitions
│   │       └── index.ts
│   │
│   ├── Dockerfile             # Frontend container image
│   ├── nginx.conf             # Nginx configuration for SPA & API proxy
│   ├── package.json           # Node.js dependencies & scripts
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite build configuration
│   ├── index.html             # HTML entry point
│   ├── .env.example           # Frontend environment template
│   ├── .env                   # Frontend environment variables
│   ├── Fastapi_Integration.md
│   └── README.md              # Frontend-specific documentation
│
├── scripts/
│   └── demo_flow.sh           # Demo/smoke test script with curl examples
│
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD pipeline
│
├── docker-compose.yml         # Root compose file (all services)
├── .env.example              # Root environment template
├── .env                      # Root environment variables
├── PR_DESCRIPTION.md         # Integration PR documentation
└── README.md                 # This file

```

---

## 🔧 Environment Setup

### Root Level (.env)

Create `.env` from `.env.example`:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=attendance_db
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql+psycopg2://postgres:your_secure_password@db:5432/attendance_db

# Security (REQUIRED - generate: openssl rand -hex 32)
SECRET_KEY=your_32_byte_hex_string

# JWT Configuration
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Application Environment
APP_ENV=development
```

### Backend Configuration

Backend uses environment variables from `.env`. Key variables:

```
POSTGRES_USER          - Database user
POSTGRES_PASSWORD      - Database password
POSTGRES_DB           - Database name
SECRET_KEY            - JWT secret (must be 32 hex chars)
ALGORITHM             - JWT algorithm (default: HS256)
ACCESS_TOKEN_EXPIRE_MINUTES - Token expiration (default: 1440 = 24h)
```

### Frontend Configuration

Frontend uses `.env.VITE_API_URL` to configure API endpoint. Set in `frontend-only/.env`:

```
VITE_API_URL=http://localhost:8000
```

---

## ▶️ Running the Application

### Full Stack (Docker)

```bash
# Start all services
docker compose up -d --build

# Initialize database
docker compose exec backend alembic upgrade head
docker compose exec backend python seed_data.py

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Backend Only

```bash
# Start backend and database
docker compose up -d db backend --build

# Or locally without Docker:
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend Only (with Docker backend)

```bash
# Terminal 1: Start backend
docker compose up -d db backend

# Terminal 2: Frontend dev mode
cd frontend-only
npm install
npm run dev
```

### Service Health Checks

```bash
# Check database connectivity
docker compose exec db pg_isready -U postgres -d attendance_db

# Check backend API
curl http://localhost:8000/docs

# Check frontend
curl http://localhost:3000
```

---

## 👨‍💻 Development Workflow

### For Backend Developers

```bash
# 1. Start services
docker compose up -d --build

# 2. Enter backend container
docker compose exec backend bash

# 3. Run tests
pytest -v

# 4. Create migration (if model changes)
alembic revision --autogenerate -m "description"
alembic upgrade head

# 5. View logs
docker compose logs -f backend
```

### For Frontend Developers

```bash
# 1. Start backend in Docker
docker compose up -d db backend
docker compose exec backend python seed_data.py

# 2. Start frontend dev server
cd frontend-only
npm install
npm run dev

# 3. Frontend automatically hot-reloads on file changes
# Access at http://localhost:5173
```

### Code Structure

**Backend** (`app/main.py` → routers → handlers):
- Authentication handled in `auth.py`
- Models defined in `models.py`
- Request/response schemas in `schemas.py`
- Routers in `routers/` (organized by feature)

**Frontend** (`src/App.tsx` → pages → components → services):
- Pages in `pages/` correspond to routes
- API calls via services in `services/`
- Reusable components in `components/`
- TypeScript types in `types/`

---

## 📚 API Documentation & Endpoints

### Quick Reference

**Base URLs:**
- Direct Backend: `http://localhost:8000`
- Via Proxy: `http://localhost:3000/api`
- Swagger UI: `http://localhost:8000/docs`

### Authentication

All protected endpoints require JWT token in `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain token from login endpoint, valid for 24 hours by default.

### Core Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login (JSON body: `{email, password}`) |
| POST | `/auth/logout` | Logout |
| POST | `/auth/change-password` | Change password |


#### Employees/Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/{id}` | Get user by ID |
| POST | `/users` | Create user (admin only) |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user (admin only) |


#### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance` | List attendance records |
| GET | `/attendance/{id}` | Get attendance by ID |
| POST | `/attendance/check-in` | Clock in |
| POST | `/attendance/check-out` | Clock out |
| POST | `/attendance/mark` | Mark attendance (admin) |

#### Leaves
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leave` | List leave requests |
| GET | `/leave/{id}` | Get leave by ID |
| POST | `/leave` | Apply for leave |
| POST | `/leave/{id}/approve` | Approve leave |
| POST | `/leave/{id}/reject` | Reject leave |

#### Holidays
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/holidays` | List holidays |
| GET | `/holidays/{id}` | Get holiday by ID |
| POST | `/holidays` | Create holiday (admin) |

#### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard statistics |

### Query Parameters

**Pagination:**
```
skip=0          - Offset (default: 0)
limit=20        - Items per page (default: 20)
```

**Sorting:**
```
sort_by=field   - Field to sort by (e.g., first_name, date)
order=asc       - Sort order: asc or desc (default: asc)
```

**Filtering:**
```
q=search        - Full-text search (on name, email, phone, etc.)
start_date      - Filter from date (YYYY-MM-DD)
end_date        - Filter to date (YYYY-MM-DD)
employee_id     - Filter by employee
```

### Example Requests

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'

# Response:
# {"access_token": "eyJ0eXAi...", "token_type": "bearer"}
```

**List Employees (with pagination and search):**
```bash
curl "http://localhost:8000/employees/list?skip=0&limit=10&q=rahul&sort_by=first_name&order=asc" \
  -H "Authorization: Bearer <token>"
```

**Check In:**
```bash
curl -X POST http://localhost:8000/attendance/check-in \
  -H "Authorization: Bearer <token>"
```

**Apply for Leave:**
```bash
curl -X POST http://localhost:8000/leave/apply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "leave_type_id": 1,
    "start_date": "2026-02-15",
    "end_date": "2026-02-17",
    "reason": "Personal leave"
  }'
```

---

## 🗄️ Database & Migrations

### Database Schema

Main tables:
- `users` - Employee accounts
- `employees` - Employee details (extended from users)
- `departments` - Organization departments
- `attendance_records` - Daily check-in/out records
- `leave_requests` - Leave applications
- `leave_balances` - Per-year leave balance tracking
- `holidays` - Company holidays
- `leave_types` - Types of leave (vacation, sick, etc.)
- `roles` - User roles (admin, manager, employee)

  ![ER Diagram](https://github.com/kp-08/Attendance-management-system/blob/main/docs/er_diagram.png)

### Migrations

Alembic manages database schema:

```bash
# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "add index on email"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback last migration
docker compose exec backend alembic downgrade -1

# View migration history
docker compose exec backend alembic history
```

### Initial Setup

```bash
# Upgrade to latest schema
docker compose exec backend alembic upgrade head

# Seed sample data (admin user, leave types, departments)
docker compose exec backend python seed_data.py
```

### Database Access

```bash
# Access PostgreSQL directly
docker compose exec db psql -U postgres -d attendance_db

# Common commands inside psql:
# \dt                 - List all tables
# \d table_name      - Describe table
# SELECT * FROM users; - Query data
```

---

## 🧪 Testing

### Backend Tests

Tests use pytest and are located in `backend/app/tests/`:

```bash
# Run all tests
docker compose exec backend pytest -v

# Run specific test file
docker compose exec backend pytest tests/test_auth.py -v

# Run with coverage report
docker compose exec backend pytest --cov=app --cov-report=html -v

# Run tests matching pattern
docker compose exec backend pytest -k "test_login" -v
```

**Test files:**
- `test_auth.py` - Authentication flows
- `test_employees.py` - Employee CRUD operations
- `test_attendance.py` - Check-in/out functionality
- `test_leaves.py` - Leave request workflows
- `test_pagination.py` - Pagination and limits
- `test_sorting.py` - Sorting and ordering

### Integration Tests

```bash
# Run smoke tests with curl
chmod +x scripts/demo_flow.sh
./scripts/demo_flow.sh
```

### Frontend Testing

```bash
# Install dependencies
cd frontend-only
npm install

# Run linter
npm run lint

# Build for production
npm run build
```

---

## 🐳 Docker Deployment

### Services

**docker-compose.yml** manages three services:

1. **PostgreSQL Database (db)**
   - Port: 5432
   - Health check: 5s intervals
   - Volume: `postgres_data` (persistent)
   - Network: `appnet`

2. **FastAPI Backend**
   - Port: 8000
   - Reload mode: Enabled (for development)
   - Depends on: db (healthy)
   - Network: `appnet`

3. **React Frontend (Nginx)**
   - Port: 3000
   - SPA routing enabled
   - API proxy: `/api/` → backend:8000
   - Network: `appnet`

### Building

```bash
# Build all services
docker compose build

# Build specific service
docker compose build backend

# Build without cache
docker compose build --no-cache
```

### Networking

All services communicate via `appnet` bridge network:

```
Frontend (port 3000) 
    ↓ (proxies /api/)
Backend (port 8000)
    ↓
Database (port 5432)
```

From the host, access via localhost ports. Between containers, use service names (e.g., `db:5432`, `backend:8000`).

### Volumes

- `postgres_data` - Persists database between restarts
- `./backend:/app` - Backend code mounted for live reload
- Frontend assets compiled at build time

### Health Checks

```bash
# Check service health
docker compose exec db pg_isready -U postgres -d attendance_db
curl http://localhost:8000/docs
curl http://localhost:3000
```

---

## 🆘 Troubleshooting

### Common Issues

**Database connection error:**
```bash
# Ensure db service is healthy
docker compose ps
docker compose logs db

# Manually check DB
docker compose exec db pg_isready -U postgres -d attendance_db
```

**JWT/Authentication errors:**
```bash
# Ensure SECRET_KEY is set and consistent
docker compose exec backend env | grep SECRET_KEY

# Regenerate and update .env
openssl rand -hex 32
# Update .env and restart
docker compose restart backend
```

**Migration errors:**
```bash
# Check migration status
docker compose exec backend alembic history

# If stuck, stamp current state
docker compose exec backend alembic stamp head

# Then upgrade
docker compose exec backend alembic upgrade head
```

**Frontend can't reach backend API:**
```bash
# Check nginx proxy config
docker compose exec frontend cat /etc/nginx/nginx.conf | grep proxy

# Test backend directly
curl http://localhost:8000/docs

# Restart frontend
docker compose restart frontend
```

**Port conflicts:**
```bash
# Check what's using port 8000
lsof -i :8000
# Or change ports in docker-compose.yml
```

**Tests failing:**
```bash
# Ensure test database is clean
docker compose exec backend pytest --cache-clear -v

# Check test logs
docker compose logs backend | grep test

# Run single test
docker compose exec backend pytest tests/test_auth.py::test_login -v
```

### Logs and Debugging

```bash
# View service logs
docker compose logs -f backend        # Follow backend logs
docker compose logs -f db             # Database logs
docker compose logs -f                # All services

# View last 100 lines
docker compose logs --tail=100 backend

# Log with timestamps
docker compose logs -f --timestamps backend
```

---

## ✨ Features

### Authentication
- ✅ JWT-based authentication (24h token expiry)
- ✅ Email/password login
- ✅ Role-based access control (admin, manager, employee)
- ✅ Password change functionality

### Employee Management
- ✅ Create, read, update, delete employees
- ✅ Department assignment
- ✅ Designation management
- ✅ Search and filtering
- ✅ Pagination and sorting

### Attendance
- ✅ Check-in / Check-out
- ✅ Date-based filtering
- ✅ Attendance records with timestamps
- ✅ Admin can manually mark attendance

### Leave Management
- ✅ Apply for leave
- ✅ Per-year leave balance tracking
- ✅ Leave type management (vacation, sick, etc.)
- ✅ Manager/Admin approval workflow
- ✅ Reject functionality

### Holidays
- ✅ Create and manage company holidays
- ✅ Holiday list for reference

### Dashboard
- ✅ Statistics and overview
- ✅ User-friendly interface

### Technical Features
- ✅ Database migrations with Alembic
- ✅ Automated test suite (pytest)
- ✅ Docker & Docker Compose support
- ✅ API documentation (Swagger UI)
- ✅ Pagination, search, sorting
- ✅ CORS and security headers
- ✅ CI/CD pipeline (GitHub Actions)

---

## 📦 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.2.4 |
| | Vite | 6.2.0 |
| | TypeScript | 5.8.2 |
| | React Router | 7.13.0 |
| **Backend** | FastAPI | 0.95.2 |
| | Uvicorn | 0.22.0 |
| | SQLAlchemy | 1.4.48 |
| | Pydantic | 1.10.11 |
| **Database** | PostgreSQL | 15 |
| | Alembic | 1.12.0 |
| **Testing** | pytest | 7.4.0 |
| **Deployment** | Docker | Latest |
| | Docker Compose | 2.0+ |
| | Nginx | Alpine |

---


## 🤝 Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run tests: `docker compose exec backend pytest -v`
4. Commit with clear message: `git commit -m "Add feature: description"`
5. Push and create pull request

### Code Quality

- Python: Follow PEP 8
- TypeScript/React: Use provided ESLint config
- All tests must pass before merge
- Update README if adding new features

---

## 🔒 Security Considerations

⚠️ **Development Only** - Not production-ready as-is:

- `SECRET_KEY` must be strongly random and kept secret
- `.env` files are git-ignored (do not commit)
- HTTPS should be used in production (add reverse proxy with SSL)
- CORS should be restricted to known domains
- Database credentials should use secrets manager (Vault, AWS Secrets, etc.)
- Implement rate limiting for API endpoints
- Use environment-based configuration for sensitive values

---

## 📄 License

This project is for educational purposes.

---

## 👤 Author & Maintenance

**Developed by:** 
Chirag Dosi & Krish Patel

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker compose logs -f`
3. Check existing documentation files
4. Review test files for API usage examples

---

***Last Updated:*** February 6, 2026  

**Version:** 1.0.2

**Status:** Active & Maintained
---
