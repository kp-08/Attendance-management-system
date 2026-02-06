# Pull Request: Frontend-Backend Integration

## Summary

This PR integrates the React/Vite frontend with the FastAPI backend into a unified Docker Compose deployment. A single `docker compose up --build` command now starts the entire stack with:

- PostgreSQL database
- Backend API at `http://localhost:8000`
- Frontend at `http://localhost:3000` (served by nginx with API proxy)

## Changes

### New Files

| File | Description |
|------|-------------|
| `docker-compose.yml` (root) | Unified compose file for all services |
| `frontend-only/Dockerfile` | Multi-stage build: npm build → nginx serve |
| `frontend-only/nginx.conf` | SPA routing + `/api/` proxy to backend |
| `.env.example` | Environment template with all required variables |
| `scripts/demo_flow.sh` | Smoke test script with curl examples |
| `.github/workflows/ci.yml` | CI pipeline for tests + build verification |
| `README.md` (root) | Comprehensive integration documentation |
| `backend/app/routers/frontend_compat.py` | Frontend-compatible API endpoints |

### Modified Files

| File | Change |
|------|--------|
| `backend/app/main.py` | Added frontend_compat router |

## API Endpoint Compatibility

The frontend expected different endpoint paths and request/response formats than the existing backend. Rather than modify the working backend or the frontend code, a **compatibility layer** was added:

| Frontend Expects | Backend Has | Solution |
|-----------------|-------------|----------|
| `POST /auth/login` (JSON) | `POST /auth/login` (OAuth2 form) | Added JSON-accepting login |
| `GET /users` | `GET /employees/list` | Added `/users` endpoint |
| `GET /attendance` | `GET /attendance/list` | Added `/attendance` endpoint |
| `POST /leave/{id}/approve` | `PUT /leave/{id}/approve` | Added POST version |
| `GET /dashboard/stats` | Not implemented | Added new endpoint |

All new endpoints are in `frontend_compat.py` and don't affect existing API behavior.

## Testing

### Automated Tests

```bash
# Run backend tests
docker compose exec backend pytest -v

# All existing tests pass ✓
```

### Manual Verification

```bash
# 1. Start services
docker compose up -d --build

# 2. Wait for health checks, run migrations and seed
docker compose exec backend alembic upgrade head
docker compose exec backend python seed_data.py

# 3. Run smoke tests
./scripts/demo_flow.sh

# 4. Test in browser
# Open http://localhost:3000
# Login with admin@company.com / admin123
```

### curl Examples

```bash
# Login via nginx proxy
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'

# Get users (with token)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# Check in
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Authorization: Bearer <token>"
```

## Development Workflow

### For Frontend Developers

```bash
# Start backend in Docker
docker compose up db backend -d

# Run frontend dev server (hot-reload)
cd frontend-only
npm install
npm run dev
```

### For Backend Developers

```bash
# Full stack in Docker
docker compose up -d --build

# Backend tests
docker compose exec backend pytest -v
```

## Breaking Changes

None. All existing backend endpoints continue to work as before.

## Checklist

- [x] Docker Compose starts all services
- [x] Frontend accessible at localhost:3000
- [x] Backend API accessible at localhost:8000
- [x] API proxy working through nginx
- [x] All backend tests passing
- [x] Login flow working
- [x] CRUD operations working
- [x] Documentation updated
- [x] CI workflow added

## Screenshots

N/A - CLI-based verification via demo_flow.sh

## Notes

- The `pgadmin` service is optional (use `--profile debug` to start it)
- Frontend build uses `/api` as API base URL, which nginx proxies to backend
- All frontend API calls work both through proxy and directly to backend
