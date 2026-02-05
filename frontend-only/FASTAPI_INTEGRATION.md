# FastAPI Backend Integration Guide

This guide helps you build a FastAPI backend that integrates with the Enterprise Nexus frontend.

## 🎯 Quick Start

### 1. Project Structure

Create the following structure for your FastAPI backend:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── database.py          # PostgreSQL connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   ├── dependencies.py      # Dependency injection
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Auth endpoints
│       ├── users.py         # User endpoints
│       ├── attendance.py    # Attendance endpoints
│       ├── leave.py         # Leave endpoints
│       ├── holidays.py      # Holiday endpoints
│       └── dashboard.py     # Dashboard endpoints
├── requirements.txt
├── .env
└── README.md
```

### 2. Install Dependencies

Create `requirements.txt`:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

Install:
```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/enterprise_nexus
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Database Setup

#### `app/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 5. Models

#### `app/models.py`

```python
from sqlalchemy import Column, String, Integer, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    personal_email = Column(String)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String, nullable=False)
    leave_balance = Column(Integer, default=0)
    phone = Column(String)
    join_date = Column(Date)
    status = Column(String, default='Active')
    login_count = Column(Integer, default=0)
    password_changed = Column(Boolean, default=False)
    reporting_to = Column(String, ForeignKey('users.id'), nullable=True)
    assigned_admin_id = Column(String, nullable=True)
    assigned_project = Column(String, nullable=True)

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey('users.id'), nullable=False)
    employee_name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    clock_in = Column(DateTime)
    clock_out = Column(DateTime)
    status = Column(String, nullable=False)
    approval_status = Column(String, default='Pending_Manager')

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, ForeignKey('users.id'), nullable=False)
    employee_name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default='Pending_Manager')
    reason = Column(Text)
    applied_date = Column(Date, nullable=False)
    days_requested = Column(Integer, nullable=False)

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String, nullable=False)
```

### 6. Pydantic Schemas

#### `app/schemas.py`

```python
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN_MASTER = "ADMIN_MASTER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    personal_email: Optional[EmailStr] = None
    role: UserRole
    department: str
    phone: Optional[str] = None
    reporting_to: Optional[str] = None
    assigned_admin_id: Optional[str] = None
    assigned_project: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    status: Optional[str] = None
    leave_balance: Optional[int] = None

class UserResponse(UserBase):
    id: str
    leave_balance: int
    join_date: Optional[date] = None
    status: str
    login_count: int
    password_changed: bool

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

class AttendanceBase(BaseModel):
    employee_id: str
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    status: str

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: str
    employee_name: str
    approval_status: str

    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    employee_id: str
    type: str
    start_date: date
    end_date: date
    reason: str

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestResponse(LeaveRequestBase):
    id: str
    employee_name: str
    status: str
    applied_date: date
    days_requested: int

    class Config:
        from_attributes = True

class HolidayBase(BaseModel):
    name: str
    date: date
    type: str

class HolidayCreate(HolidayBase):
    pass

class HolidayResponse(HolidayBase):
    id: str

    class Config:
        from_attributes = True
```

### 7. Authentication

#### `app/auth.py`

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from .database import get_db
from .models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
```

### 8. Main Application

#### `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, users, attendance, leave, holidays, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise Nexus API",
    description="HR & Attendance Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(leave.router, prefix="/leave", tags=["Leave"])
app.include_router(holidays.router, prefix="/holidays", tags=["Holidays"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

@app.get("/")
def read_root():
    return {"message": "Enterprise Nexus API is running"}
```

### 9. Example Router

#### `app/routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, UserResponse
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Update login count
    user.login_count += 1
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        user=UserResponse.from_orm(user),
        token=access_token,
        message="Login successful"
    )
```

### 10. Run the Application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Your API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🔐 Security Best Practices

1. Change the SECRET_KEY in production
2. Use environment variables for sensitive data
3. Implement rate limiting
4. Add input validation
5. Use HTTPS in production
6. Implement proper error handling
7. Add request logging
8. Use database migrations (Alembic)

## 🎯 Next Steps

1. Implement all routers (users, attendance, leave, holidays, dashboard)
2. Add data validation and error handling
3. Implement role-based access control
4. Add database migrations with Alembic
5. Write unit tests
6. Set up CI/CD pipeline
7. Deploy to production
