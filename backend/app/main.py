from fastapi import FastAPI
from app.database import engine, Base
from app.routers import auth, employees, attendance, holidays, leaves, frontend_compat
from fastapi.middleware.cors import CORSMiddleware
from app import models  # Import models to register them with Base

app = FastAPI(title="Attendance + Phonebook API")

# Create tables on startup (for development; prefer alembic migrations in production)
Base.metadata.create_all(bind=engine)

# Frontend compatibility layer - MUST be registered first so JSON login takes precedence
# These endpoints wrap the original functionality with frontend-compatible request/response formats
app.include_router(frontend_compat.router)

# Original API routers (OAuth2 form login at /auth/login will be shadowed by JSON version above)
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(holidays.router)
app.include_router(leaves.router)



origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

