# Employee Management System - Full Stack Integration

A complete full-stack application for employee attendance, leave management, and phonebook functionality.

**Frontend:** React + Vite + TypeScript  
**Backend:** FastAPI + SQLAlchemy + PostgreSQL  
**Deployment:** Docker Compose with nginx reverse proxy

---

## 🚀 Quick Start (Production Mode)

Run the entire stack with a single command:

```bash
# 1. Clone and navigate to the repo
cd Intern-project-test

# 2. Copy environment template
cp .env.example .env

# 3. Generate a secure secret key and update .env
openssl rand -hex 32
# Edit .env and set SECRET_KEY=<generated-key>

# 4. Start all services
docker compose up -d --build

# 5. Run migrations and seed data
docker compose exec backend alembic upgrade head
docker compose exec backend python seed_data.py
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React SPA (served by nginx) |
| **Backend API** | http://localhost:8000 | FastAPI (direct access) |
| **API via Proxy** | http://localhost:3000/api/ | API through nginx proxy |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **pgAdmin** | http://localhost:8080 | Database admin (optional) |

### Default Login

After seeding:
- **Email:** `admin@company.com`
- **Password:** `admin123`

---

## 💻 Development Mode

For frontend development with hot-reload:

### Option 1: Frontend Dev Server + Docker Backend

```bash
# Terminal 1: Start backend services
docker compose up db backend -d

# Terminal 2: Start frontend dev server
cd frontend-only
npm install
npm run dev
```

Frontend runs at http://localhost:3000 with hot-reload.  
API calls are proxied to http://localhost:8000.

### Option 2: Full Docker (No Hot-reload)

```bash
docker compose up -d --build
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=attendance_db

# Security (REQUIRED - generate with: openssl rand -hex 32)
SECRET_KEY=your_32_byte_hex_secret

# JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 📁 Project Structure

```
.
├── docker-compose.yml          # Root compose file (starts all services)
├── .env.example                # Environment template
├── .github/workflows/ci.yml    # CI/CD pipeline
├── scripts/
│   └── demo_flow.sh            # Smoke test script
├── backend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py             # FastAPI application
│   │   ├── routers/            # API endpoints
│   │   │   ├── auth.py         # Authentication (OAuth2)
│   │   │   ├── employees.py    # Employee CRUD
│   │   │   ├── attendance.py   # Check-in/out
│   │   │   ├── leaves.py       # Leave requests
│   │   │   ├── holidays.py     # Holiday management
│   │   │   └── frontend_compat.py  # Frontend-compatible API
│   │   └── ...
│   ├── alembic/                # Database migrations
│   └── tests/                  # pytest tests
└── frontend-only/
    ├── Dockerfile              # Multi-stage build
    ├── nginx.conf              # Proxy + SPA config
    └── src/
        ├── pages/              # React pages
        ├── services/           # API services
        └── config/api.ts       # API configuration
```

---

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
docker compose exec backend pytest -v

# Run with coverage
docker compose exec backend pytest --cov=app -v

# Run specific test file
docker compose exec backend pytest tests/test_auth.py -v
```

### Smoke Tests

```bash
# Run integration smoke tests
chmod +x scripts/demo_flow.sh
./scripts/demo_flow.sh
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login (JSON body: `{email, password}`) |
| POST | `/auth/logout` | Logout |
| POST | `/auth/change-password` | Change password |

### Users / Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/{id}` | Get user by ID |
| POST | `/users` | Create user (admin only) |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user (admin only) |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance` | List attendance records |
| GET | `/attendance/{id}` | Get attendance by ID |
| POST | `/attendance/check-in` | Clock in |
| POST | `/attendance/check-out` | Clock out |
| POST | `/attendance/mark` | Mark attendance (admin) |

### Leave Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leave` | List leave requests |
| GET | `/leave/{id}` | Get leave by ID |
| POST | `/leave` | Apply for leave |
| POST | `/leave/{id}/approve` | Approve leave |
| POST | `/leave/{id}/reject` | Reject leave |

### Holidays
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/holidays` | List holidays |
| GET | `/holidays/{id}` | Get holiday by ID |
| POST | `/holidays` | Create holiday (admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard statistics |

---

## 🔄 curl Examples

### Login (via nginx proxy)

```bash
# JSON login (frontend-compatible)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'

# OAuth2 form login (direct backend)
curl -X POST http://localhost:8000/auth/login \
  -d "username=admin@company.com&password=admin123"
```

### Get Users (authenticated)

```bash
TOKEN="your-jwt-token"
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Check In

```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN"
```

### Apply for Leave

```bash
curl -X POST http://localhost:3000/api/leave \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-02-10",
    "endDate": "2026-02-12",
    "reason": "Family vacation",
    "type": "Vacation"
  }'
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Database connection issues

```bash
# Ensure database is healthy
docker compose exec db pg_isready

# Check database URL in backend
docker compose exec backend env | grep DATABASE_URL
```

### Frontend can't reach API

1. Check nginx proxy is working:
   ```bash
   curl http://localhost:3000/api/holidays
   ```

2. Check CORS settings in backend (should allow `http://localhost:3000`)

3. Verify backend is running:
   ```bash
   curl http://localhost:8000/docs
   ```

### Tests failing

```bash
# Run migrations first
docker compose exec backend alembic upgrade head

# Check test database
docker compose exec backend pytest -v --tb=long
```

---

## 📝 Frontend Development Notes

### API Configuration

The frontend uses environment variable `VITE_API_BASE_URL` for API calls.

- **Production (Docker):** Set to `/api` (requests proxied through nginx)
- **Development:** Set to `http://localhost:8000` (direct backend access)

### Adding New Features

1. Create service in `frontend-only/src/services/`
2. Add endpoint to `frontend-only/src/config/api.ts`
3. If backend endpoint doesn't exist, add stub to `backend/app/routers/frontend_compat.py`

---

## 🚢 Production Deployment

For production deployment:

1. Update `.env` with secure passwords
2. Configure SSL/TLS (update nginx.conf for HTTPS)
3. Set `APP_ENV=production`
4. Consider using Docker Swarm or Kubernetes
5. Add proper logging and monitoring

---

## 📄 License

Internal project - All rights reserved.
