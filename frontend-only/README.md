# Enterprise Nexus - Frontend Only

This is the **frontend-only** version of the Enterprise Nexus Attendance & HR Management System. All backend logic has been removed and replaced with API service layers that can be easily integrated with a **FastAPI + PostgreSQL** backend.

## 🎯 Overview

This React + TypeScript application is ready to connect to your FastAPI backend. All data fetching and state management is handled through service layers that make HTTP requests to your backend API.

## 📁 Project Structure

```
frontend-only/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AttendancePage.tsx
│   │   ├── LeavePage.tsx
│   │   ├── PhonebookPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── AdminMasterPage.tsx
│   │   └── ManagerPage.tsx
│   ├── services/           # API service layers
│   │   ├── authService.ts      # Authentication APIs
│   │   ├── userService.ts      # User management APIs
│   │   ├── attendanceService.ts # Attendance APIs
│   │   ├── leaveService.ts     # Leave management APIs
│   │   └── holidayService.ts   # Holiday APIs
│   ├── config/
│   │   └── api.ts          # API configuration and base URL
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── App.tsx             # Main app component
│   └── main.tsx            # App entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env                    # Environment variables
└── .env.example            # Example environment file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Endpoint

Update the `.env` file with your FastAPI backend URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## 🔌 FastAPI Backend Integration

### Required FastAPI Endpoints

Your FastAPI backend should implement the following endpoints:

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/change-password` - Change password

#### Users
- `GET /users` - Get all users
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

#### Attendance
- `GET /attendance` - Get all attendance records
- `GET /attendance/{id}` - Get attendance by ID
- `POST /attendance/mark` - Mark attendance (clock in/out)
- `PUT /attendance/{id}` - Update attendance record
- `DELETE /attendance/{id}` - Delete attendance record

#### Leave
- `GET /leave` - Get all leave requests
- `GET /leave/{id}` - Get leave request by ID
- `POST /leave` - Create leave request
- `PUT /leave/{id}` - Update leave request
- `DELETE /leave/{id}` - Delete leave request
- `POST /leave/{id}/approve` - Approve leave request
- `POST /leave/{id}/reject` - Reject leave request

#### Holidays
- `GET /holidays` - Get all holidays
- `GET /holidays/{id}` - Get holiday by ID
- `POST /holidays` - Create holiday
- `PUT /holidays/{id}` - Update holiday
- `DELETE /holidays/{id}` - Delete holiday

#### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

### Expected Response Formats

#### Login Response
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "ADMIN_MASTER" | "ADMIN" | "MANAGER" | "EMPLOYEE",
    "department": "string",
    "leaveBalance": number,
    ...
  },
  "token": "string",
  "message": "string"
}
```

#### Standard Success Response
```json
{
  "data": {...},
  "message": "string"
}
```

#### Error Response
```json
{
  "message": "string",
  "detail": "string"
}
```

## 🔐 Authentication

The frontend uses JWT token-based authentication:

1. Login credentials are sent to `/auth/login`
2. Backend returns a JWT token
3. Token is stored in `localStorage`
4. Token is sent in the `Authorization` header for all subsequent requests

```typescript
Authorization: Bearer <token>
```

## 📝 Using the Service Layers

All API calls are made through service layers in `src/services/`:

### Example: User Login

```typescript
import { authService } from './services/authService';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authService.login({ email, password });
    console.log('Logged in user:', response.user);
    // Navigate to dashboard
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Example: Fetch Users

```typescript
import { userService } from './services/userService';

const fetchUsers = async () => {
  try {
    const users = await userService.getAllUsers();
    console.log('Users:', users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};
```

### Example: Mark Attendance

```typescript
import { attendanceService } from './services/attendanceService';

const markAttendance = async (employeeId: string) => {
  try {
    const record = await attendanceService.markAttendance({
      employeeId,
      clockIn: new Date().toISOString(),
      status: 'Present'
    });
    console.log('Attendance marked:', record);
  } catch (error) {
    console.error('Failed to mark attendance:', error);
  }
};
```

## 🛠️ Customizing API Configuration

### Change Base URL

Edit `src/config/api.ts`:

```typescript
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

### Add New Endpoints

Add to the `API_ENDPOINTS` object in `src/config/api.ts`:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  MY_NEW_ENDPOINT: '/my-endpoint',
};
```

### Customize Request Headers

Modify the `apiRequest` function in `src/config/api.ts` to add custom headers:

```typescript
const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'X-Custom-Header': 'value',
};
```

## 🎨 User Roles

The application supports four user roles:

1. **ADMIN_MASTER** - Full system access
2. **ADMIN** - Manage users, attendance, and leaves
3. **MANAGER** - Manage team members and approve requests
4. **EMPLOYEE** - Basic access to attendance and leave

## 📦 PostgreSQL Database Schema

Your FastAPI backend should use PostgreSQL with the following tables:

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    personal_email VARCHAR,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    leave_balance INTEGER DEFAULT 0,
    phone VARCHAR,
    join_date DATE,
    status VARCHAR DEFAULT 'Active',
    login_count INTEGER DEFAULT 0,
    password_changed BOOLEAN DEFAULT FALSE,
    reporting_to VARCHAR,
    assigned_admin_id VARCHAR,
    assigned_project VARCHAR
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR REFERENCES users(id),
    employee_name VARCHAR,
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    status VARCHAR NOT NULL,
    approval_status VARCHAR DEFAULT 'Pending_Manager'
);
```

### Leave Requests Table
```sql
CREATE TABLE leave_requests (
    id VARCHAR PRIMARY KEY,
    employee_id VARCHAR REFERENCES users(id),
    employee_name VARCHAR,
    type VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR DEFAULT 'Pending_Manager',
    reason TEXT,
    applied_date DATE NOT NULL,
    days_requested INTEGER NOT NULL
);
```

### Holidays Table
```sql
CREATE TABLE holidays (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    date DATE NOT NULL,
    type VARCHAR NOT NULL
);
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### TypeScript Types

All TypeScript interfaces are defined in `src/types/index.ts`. Update these to match your backend data models.

## 🌐 CORS Configuration

Make sure your FastAPI backend has CORS enabled:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Note**: This is a frontend-only application. You need to implement the FastAPI backend separately with the endpoints and data models described above.
