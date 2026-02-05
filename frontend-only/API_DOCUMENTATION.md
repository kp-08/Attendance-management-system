# API Documentation

Complete API documentation for the Enterprise Nexus backend.

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints except `/auth/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /auth/login

Login to the system.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "leaveBalance": 20,
    "status": "Active",
    "loginCount": 5,
    "passwordChanged": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

### POST /auth/logout

Logout from the system.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Logout successful"
}
```

---

### POST /auth/change-password

Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Current password incorrect
- `401 Unauthorized` - Invalid token

---

## User Endpoints

### GET /users

Get all users.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` (optional): Filter by role (ADMIN_MASTER, ADMIN, MANAGER, EMPLOYEE)
- `department` (optional): Filter by department
- `status` (optional): Filter by status (Active, Inactive)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "personalEmail": "john.personal@example.com",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "leaveBalance": 20,
    "phone": "+1234567890",
    "joinDate": "2024-01-15",
    "status": "Active",
    "loginCount": 5,
    "passwordChanged": true,
    "reportingTo": "manager-uuid",
    "assignedAdminId": "admin-uuid",
    "assignedProject": "Project Alpha"
  }
]
```

---

### GET /users/{id}

Get user by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Doe",
  ...
}
```

**Error Responses:**
- `404 Not Found` - User not found

---

### POST /users

Create new user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "personalEmail": "jane.personal@example.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "department": "Engineering",
  "phone": "+1234567890",
  "reportingTo": "manager-uuid",
  "assignedAdminId": "admin-uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "name": "Jane Smith",
  ...
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data
- `409 Conflict` - Email already exists

---

### PUT /users/{id}

Update user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "department": "HR",
  "status": "Active"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Jane Smith Updated",
  ...
}
```

---

### DELETE /users/{id}

Delete user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - User not found
- `403 Forbidden` - Insufficient permissions

---

## Attendance Endpoints

### GET /attendance

Get all attendance records.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `employeeId` (optional): Filter by employee
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `status` (optional): Filter by status (Present, Late, Absent, Holiday)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "employeeId": "employee-uuid",
    "employeeName": "John Doe",
    "date": "2024-02-03",
    "clockIn": "2024-02-03T09:00:00Z",
    "clockOut": "2024-02-03T18:00:00Z",
    "status": "Present",
    "approvalStatus": "Approved"
  }
]
```

---

### GET /attendance/{id}

Get attendance record by ID.

**Response:** `200 OK`

---

### POST /attendance/mark

Mark attendance (clock in/out).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "employeeId": "employee-uuid",
  "clockIn": "2024-02-03T09:00:00Z",
  "clockOut": "2024-02-03T18:00:00Z",
  "status": "Present"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "employeeId": "employee-uuid",
  "employeeName": "John Doe",
  "date": "2024-02-03",
  "clockIn": "2024-02-03T09:00:00Z",
  "clockOut": "2024-02-03T18:00:00Z",
  "status": "Present",
  "approvalStatus": "Pending_Manager"
}
```

---

### PUT /attendance/{id}

Update attendance record.

**Request Body:**
```json
{
  "clockOut": "2024-02-03T18:30:00Z",
  "approvalStatus": "Approved"
}
```

**Response:** `200 OK`

---

### DELETE /attendance/{id}

Delete attendance record.

**Response:** `204 No Content`

---

## Leave Endpoints

### GET /leave

Get all leave requests.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `employeeId` (optional): Filter by employee
- `status` (optional): Filter by status
- `type` (optional): Filter by type (Sick, Vacation, Personal)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "employeeId": "employee-uuid",
    "employeeName": "John Doe",
    "type": "Vacation",
    "startDate": "2024-03-01",
    "endDate": "2024-03-05",
    "status": "Approved",
    "reason": "Family vacation",
    "appliedDate": "2024-02-01",
    "daysRequested": 5
  }
]
```

---

### POST /leave

Create leave request.

**Request Body:**
```json
{
  "employeeId": "employee-uuid",
  "type": "Vacation",
  "startDate": "2024-03-01",
  "endDate": "2024-03-05",
  "reason": "Family vacation"
}
```

**Response:** `201 Created`

---

### PUT /leave/{id}

Update leave request.

**Response:** `200 OK`

---

### POST /leave/{id}/approve

Approve leave request.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "Approved",
  ...
}
```

---

### POST /leave/{id}/reject

Reject leave request.

**Request Body:**
```json
{
  "reason": "Insufficient staff during requested period"
}
```

**Response:** `200 OK`

---

## Holiday Endpoints

### GET /holidays

Get all holidays.

**Query Parameters:**
- `year` (optional): Filter by year

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Independence Day",
    "date": "2024-08-15",
    "type": "Public"
  }
]
```

---

### POST /holidays

Create holiday.

**Request Body:**
```json
{
  "name": "New Year",
  "date": "2025-01-01",
  "type": "Public"
}
```

**Response:** `201 Created`

---

### PUT /holidays/{id}

Update holiday.

**Response:** `200 OK`

---

### DELETE /holidays/{id}

Delete holiday.

**Response:** `204 No Content`

---

## Dashboard Endpoints

### GET /dashboard/stats

Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "totalEmployees": 150,
  "presentToday": 142,
  "absentToday": 8,
  "pendingLeaveRequests": 5,
  "upcomingHolidays": 3,
  "averageAttendance": 94.6
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data",
  "message": "Validation error"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API calls are rate limited to 100 requests per minute per user. Exceeding this limit will result in:

**Response:** `429 Too Many Requests`
```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

---

## Pagination

For endpoints that return lists, pagination is supported:

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 50, max: 100)

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Page-Size: 50
X-Total-Pages: 3
```
