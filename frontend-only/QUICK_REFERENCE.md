# 🚀 Backend Developer Quick Reference

## 📋 What You Need to Build

A **FastAPI + PostgreSQL** backend that implements these endpoints:

## 🔑 Authentication Endpoints

```python
@app.post("/auth/login")
async def login(credentials: LoginRequest):
    # Validate email/password
    # Return: { user: {...}, token: "...", message: "..." }
    
@app.post("/auth/logout")
async def logout():
    # Handle logout
    
@app.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest):
    # Update password
```

## 👥 User Endpoints

```python
@app.get("/users")
async def get_users():
    # Return list of users
    
@app.get("/users/{id}")
async def get_user(id: str):
    # Return single user
    
@app.post("/users")
async def create_user(user: UserCreate):
    # Create new user
    
@app.put("/users/{id}")
async def update_user(id: str, data: UserUpdate):
    # Update user
    
@app.delete("/users/{id}")
async def delete_user(id: str):
    # Delete user
```

## 📅 Attendance Endpoints

```python
@app.get("/attendance")
async def get_attendance():
    # Return attendance records
    
@app.post("/attendance/mark")
async def mark_attendance(data: MarkAttendanceRequest):
    # Clock in/out
    
@app.put("/attendance/{id}")
async def update_attendance(id: str, data: UpdateAttendance):
    # Update record
```

## 🏖️ Leave Endpoints

```python
@app.get("/leave")
async def get_leave_requests():
    # Return leave requests
    
@app.post("/leave")
async def create_leave_request(data: CreateLeaveRequest):
    # Create new request
    
@app.post("/leave/{id}/approve")
async def approve_leave(id: str):
    # Approve request
    
@app.post("/leave/{id}/reject")
async def reject_leave(id: str):
    # Reject request
```

## 🎉 Holiday Endpoints

```python
@app.get("/holidays")
async def get_holidays():
    # Return holidays
    
@app.post("/holidays")
async def create_holiday(data: HolidayCreate):
    # Create holiday
```

## 📊 Dashboard Endpoint

```python
@app.get("/dashboard/stats")
async def get_dashboard_stats():
    # Return statistics
    return {
        "totalEmployees": 150,
        "presentToday": 142,
        "absentToday": 8,
        "pendingLeaveRequests": 5
    }
```

## 🗄️ Database Tables

### users
```sql
id, name, email, personal_email, password, role,
department, leave_balance, phone, join_date, status,
login_count, password_changed, reporting_to,
assigned_admin_id, assigned_project
```

### attendance
```sql
id, employee_id, employee_name, date, clock_in,
clock_out, status, approval_status
```

### leave_requests
```sql
id, employee_id, employee_name, type, start_date,
end_date, status, reason, applied_date, days_requested
```

### holidays
```sql
id, name, date, type
```

## 🔐 Authentication

**JWT Token Required**
```
Authorization: Bearer <token>
```

**Login Response Format:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "EMPLOYEE",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

## 🌐 CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📦 Required Python Packages

```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
python-multipart
pydantic
pydantic-settings
python-dotenv
```

## 🏃 Quick Start Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000

# API docs
http://localhost:8000/docs
```

## 🎯 User Roles

- `ADMIN_MASTER` - Full system access
- `ADMIN` - Manage users and approvals
- `MANAGER` - Manage team members
- `EMPLOYEE` - Basic access

## ⚡ Testing the API

```bash
# Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Test with token
curl http://localhost:8000/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📁 Minimal FastAPI Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app
│   ├── database.py      # DB connection
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Auth logic
│   └── routers/         # Endpoint routers
├── .env                 # Environment vars
└── requirements.txt     # Dependencies
```

## 🔍 Check Full Documentation

- **FASTAPI_INTEGRATION.md** - Complete backend guide
- **API_DOCUMENTATION.md** - Full API reference
- **SETUP_GUIDE.md** - Frontend setup

---

**Need help?** Check the detailed documentation files! 📚
