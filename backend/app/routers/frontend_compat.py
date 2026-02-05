"""
Frontend Compatibility Router
-----------------------------
This module provides API endpoints that match what the frontend expects.
It acts as an adapter layer between the frontend's expected API and the
existing backend implementation.

Some endpoints are stubs returning 501 for features not yet implemented.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.auth import create_access_token, verify_password, hash_password
from app.email_service import send_onboarding_email
from app.config import settings
from datetime import timedelta

router = APIRouter(tags=["frontend-compat"])


def get_leave_balance(db: Session, employee_id: int) -> int:
    """Get the remaining leave balance for an employee."""
    current_year = date.today().year
    balance = db.query(models.LeaveBalance).filter_by(
        employee_id=employee_id,
        year=current_year
    ).first()
    
    if balance:
        return balance.remaining_leaves
    else:
        # Default balance if no record exists
        return 17


# ============================================
# AUTH ENDPOINTS - Frontend Compatible
# ============================================

class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    # OAuth2 compatibility
    username: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    leaveBalance: int = 17
    status: str = "Active"


class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    message: str


def _do_login(email: str, password: str, db: Session, return_frontend_format: bool = True):
    """
    Shared login logic that can return either frontend format or OAuth2 format.
    """
    user = db.query(models.Employee).filter(
        models.Employee.email == email
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token(
        {"user_id": user.id, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    if return_frontend_format:
        # Frontend format
        user_response = {
            "id": str(user.id),
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "role": user.role.value.upper(),
            "department": user.department_id and str(user.department_id) or "General",
            "leaveBalance": get_leave_balance(db, user.id),
            "status": "Active"
        }
        return {
            "user": user_response,
            "token": token,
            "message": "Login successful"
        }
    else:
        # OAuth2 format (for tests and legacy)
        return {
            "access_token": token,
            "token_type": "bearer"
        }


@router.post("/auth/login")
async def frontend_login(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Universal login endpoint - handles both:
    1. JSON body with email/password (frontend format) - returns {user, token, message}
    2. OAuth2 form with username/password (tests/legacy) - returns {access_token, token_type}
    """
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        # JSON request (frontend)
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
            if not email or not password:
                raise HTTPException(status_code=422, detail="Email/username and password required")
            return _do_login(email, password, db, return_frontend_format=True)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=422, detail=str(e))
    else:
        # Form data (OAuth2 - for tests)
        try:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
            if not username or not password:
                raise HTTPException(status_code=422, detail="username and password required")
            return _do_login(username, password, db, return_frontend_format=False)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=422, detail=str(e))


@router.post("/auth/logout")
def frontend_logout(user=Depends(get_current_user)):
    """
    Logout endpoint - clears session on client side.
    Server-side is stateless with JWT, so this just returns success.
    """
    return {"message": "Logged out successfully"}


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


@router.post("/auth/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Change password for current user."""
    if not verify_password(payload.currentPassword, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = hash_password(payload.newPassword)
    db.commit()
    return {"message": "Password changed successfully"}


# ============================================
# USERS ENDPOINTS - Maps to /employees
# ============================================

@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Get all users - maps to employees list.
    Transforms employee data to frontend User format.
    All users can see the complete directory.
    """
    query = db.query(models.Employee)

    # All users can see the full directory
    employees = query.offset(skip).limit(limit).all()

    # Transform to frontend format
    users = []
    for emp in employees:
        # Get manager name if assigned
        manager_name = None
        if emp.manager_id:
            manager = db.query(models.Employee).filter(models.Employee.id == emp.manager_id).first()
            if manager:
                manager_name = f"{manager.first_name} {manager.last_name}"

        users.append({
            "id": str(emp.id),
            "name": f"{emp.first_name} {emp.last_name}",
            "email": emp.email,
            "personalEmail": emp.email,
            "role": emp.role.value.upper(),
            "department": str(emp.department_id) if emp.department_id else "General",
            "leaveBalance": get_leave_balance(db, emp.id),
            "phone": emp.phone or "",
            "status": "Active",
            "loginCount": 0,
            "passwordChanged": True,
            "designation": emp.designation or "",
            "reportingTo": str(emp.manager_id) if emp.manager_id else None,
            "reportingManagerName": manager_name
        })

    return users


@router.get("/users/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get user by ID."""
    emp = db.query(models.Employee).filter(models.Employee.id == int(user_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="User not found")

    # Get manager name if assigned
    manager_name = None
    if emp.manager_id:
        manager = db.query(models.Employee).filter(models.Employee.id == emp.manager_id).first()
        if manager:
            manager_name = f"{manager.first_name} {manager.last_name}"

    return {
        "id": str(emp.id),
        "name": f"{emp.first_name} {emp.last_name}",
        "email": emp.email,
        "personalEmail": emp.email,
        "role": emp.role.value.upper(),
        "department": str(emp.department_id) if emp.department_id else "General",
        "leaveBalance": get_leave_balance(db, emp.id),
        "phone": emp.phone or "",
        "status": "Active",
        "loginCount": 0,
        "passwordChanged": True,
        "designation": emp.designation or "",
        "reportingTo": str(emp.manager_id) if emp.manager_id else None,
        "reportingManagerName": manager_name
    }


class CreateUserRequest(BaseModel):
    name: str
    email: str
    personalEmail: Optional[str] = None
    password: str
    role: str
    department: str
    phone: Optional[str] = None
    reportingTo: Optional[str] = None  # Manager ID


@router.post("/users")
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Create a new user."""
    if user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can create users")

    existing = db.query(models.Employee).filter(models.Employee.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Parse name into first/last
    name_parts = payload.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Map frontend role to backend enum
    role_map = {
        "ADMIN_MASTER": models.RoleEnum.admin,
        "ADMIN": models.RoleEnum.admin,
        "MANAGER": models.RoleEnum.manager,
        "EMPLOYEE": models.RoleEnum.employee
    }
    role = role_map.get(payload.role.upper(), models.RoleEnum.employee)

    # Parse manager_id if provided
    manager_id = None
    if payload.reportingTo:
        try:
            manager_id = int(payload.reportingTo)
        except ValueError:
            pass

    emp = models.Employee(
        first_name=first_name,
        last_name=last_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone or "",
        designation="",
        department_id=None,
        role=role,
        manager_id=manager_id
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    # Send onboarding email with credentials to personal email
    email_sent = False
    if payload.personalEmail:
        email_sent = send_onboarding_email(
            personal_email=payload.personalEmail,
            employee_name=f"{first_name} {last_name}",
            company_email=payload.email,
            password=payload.password  # Send the plain text password before it was hashed
        )

    # Get manager name if assigned
    manager_name = None
    if emp.manager_id:
        manager = db.query(models.Employee).filter(models.Employee.id == emp.manager_id).first()
        if manager:
            manager_name = f"{manager.first_name} {manager.last_name}"

    return {
        "id": str(emp.id),
        "name": f"{emp.first_name} {emp.last_name}",
        "email": emp.email,
        "personalEmail": payload.personalEmail or "",
        "password": payload.password,  # Return password for display in success modal
        "role": emp.role.value.upper(),
        "department": payload.department,
        "phone": emp.phone or "",
        "status": "Active",
        "reportingTo": str(emp.manager_id) if emp.manager_id else None,
        "reportingManagerName": manager_name,
        "emailSent": email_sent
    }


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Update user by ID."""
    if user.role != models.RoleEnum.admin and str(user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    emp = db.query(models.Employee).filter(models.Employee.id == int(user_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name:
        name_parts = payload.name.split(" ", 1)
        emp.first_name = name_parts[0]
        emp.last_name = name_parts[1] if len(name_parts) > 1 else ""

    if payload.email:
        emp.email = payload.email
    if payload.phone:
        emp.phone = payload.phone

    db.commit()
    db.refresh(emp)

    return {
        "id": str(emp.id),
        "name": f"{emp.first_name} {emp.last_name}",
        "email": emp.email,
        "role": emp.role.value.upper(),
        "status": "Active"
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Delete user by ID."""
    if user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can delete users")

    emp = db.query(models.Employee).filter(models.Employee.id == int(user_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(emp)
    db.commit()
    return {"message": "User deleted successfully"}


# ============================================
# ATTENDANCE ENDPOINTS - Frontend Compatible
# ============================================

@router.get("/attendance")
def get_all_attendance(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get all attendance records in frontend format."""
    query = db.query(models.AttendanceRecord)

    if user.role == models.RoleEnum.employee:
        # Employees see only their own records
        query = query.filter(models.AttendanceRecord.employee_id == user.id)
    elif user.role == models.RoleEnum.manager:
        # Managers see their own + their direct reports' records
        subordinate_ids = [emp.id for emp in db.query(models.Employee).filter(
            models.Employee.manager_id == user.id
        ).all()]
        subordinate_ids.append(user.id)  # Include manager's own records
        query = query.filter(models.AttendanceRecord.employee_id.in_(subordinate_ids))
    # Admins see all records (no filter needed)

    records = query.order_by(models.AttendanceRecord.date.desc()).offset(skip).limit(limit).all()

    # Transform to frontend format
    result = []
    for rec in records:
        # Get employee name
        emp = db.query(models.Employee).filter(models.Employee.id == rec.employee_id).first()
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        
        # Get entries count
        entries_count = db.query(models.AttendanceEntry).filter(
            models.AttendanceEntry.attendance_record_id == rec.id
        ).count()

        result.append({
            "id": str(rec.id),
            "employeeId": str(rec.employee_id),
            "employeeName": emp_name,
            "date": str(rec.date),
            "clockIn": rec.check_in_time.strftime("%H:%M") if rec.check_in_time else None,
            "clockOut": rec.check_out_time.strftime("%H:%M") if rec.check_out_time else None,
            "status": rec.status or "Present",
            "approvalStatus": rec.approval_status or "Pending_Manager",
            "entriesCount": entries_count,
            "isConfirmed": getattr(rec, 'is_confirmed', False) or False,
            "confirmedAt": rec.confirmed_at.strftime("%H:%M") if getattr(rec, 'confirmed_at', None) else None
        })

    return result


@router.get("/attendance/list")
def list_attendance(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: Optional[str] = None,
    order: str = "desc",
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Paginated attendance list with optional filtering and sorting.
    This endpoint is compatible with both frontend and backend tests.
    """
    allowed_sort_fields = {"date", "check_in_time", "check_out_time"}

    if order not in ("asc", "desc"):
        raise HTTPException(status_code=400, detail="order must be 'asc' or 'desc'")

    query = db.query(models.AttendanceRecord)

    # Scope by role
    if user.role == models.RoleEnum.employee:
        query = query.filter(models.AttendanceRecord.employee_id == user.id)
    else:
        if employee_id:
            query = query.filter(models.AttendanceRecord.employee_id == employee_id)

    # date range
    if start_date:
        query = query.filter(models.AttendanceRecord.date >= start_date)
    if end_date:
        query = query.filter(models.AttendanceRecord.date <= end_date)

    # sorting
    if sort_by:
        if sort_by not in allowed_sort_fields:
            raise HTTPException(status_code=400, detail=f"Invalid sort_by field. Allowed: {sorted(list(allowed_sort_fields))}")
        col = getattr(models.AttendanceRecord, sort_by)
        if order == "asc":
            query = query.order_by(col.asc())
        else:
            query = query.order_by(col.desc())
    else:
        # default
        query = query.order_by(models.AttendanceRecord.date.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/attendance/{record_id}")
def get_attendance_by_id(
    record_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get single attendance record."""
    rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.id == int(record_id)
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    emp = db.query(models.Employee).filter(models.Employee.id == rec.employee_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"

    return {
        "id": str(rec.id),
        "employeeId": str(rec.employee_id),
        "employeeName": emp_name,
        "date": str(rec.date),
        "clockIn": rec.check_in_time.strftime("%H:%M") if rec.check_in_time else None,
        "clockOut": rec.check_out_time.strftime("%H:%M") if rec.check_out_time else None,
        "status": rec.status or "Present",
        "approvalStatus": rec.approval_status or "Pending_Manager"
    }


class MarkAttendanceRequest(BaseModel):
    employeeId: str
    clockIn: str
    clockOut: Optional[str] = None
    status: str = "Present"


def parse_clock_time(time_str: str, today: date) -> datetime:
    """Parse various clock time formats to datetime."""
    if not time_str:
        return None
    # Handle simple time format like "09:00" or "09:00:00"
    if len(time_str) <= 8 and ':' in time_str and '-' not in time_str:
        # Parse HH:MM or HH:MM:SS format
        parts = time_str.split(':')
        hour = int(parts[0])
        minute = int(parts[1])
        second = int(parts[2]) if len(parts) > 2 else 0
        return datetime(today.year, today.month, today.day, hour, minute, second)
    # Handle ISO format
    return datetime.fromisoformat(time_str.replace('Z', '+00:00'))


@router.post("/attendance/mark")
def mark_attendance(
    payload: MarkAttendanceRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Mark attendance - frontend compatible endpoint.
    Creates or updates attendance record for the day.
    """
    today = date.today()
    employee_id = int(payload.employeeId)

    # Check if record exists for today
    rec = db.query(models.AttendanceRecord).filter_by(
        employee_id=employee_id,
        date=today
    ).first()

    clock_in_time = parse_clock_time(payload.clockIn, today)

    if rec:
        # Update existing record
        if payload.clockOut:
            rec.check_out_time = parse_clock_time(payload.clockOut, today)
        rec.status = payload.status
        db.commit()
        db.refresh(rec)
    else:
        # Create new record - determine initial approval status based on employee role
        emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        initial_approval_status = "Pending_Admin" if emp and emp.role == models.RoleEnum.manager else "Pending_Manager"
        
        rec = models.AttendanceRecord(
            employee_id=employee_id,
            date=today,
            check_in_time=clock_in_time,
            check_out_time=parse_clock_time(payload.clockOut, today) if payload.clockOut else None,
            status=payload.status,
            approval_status=initial_approval_status
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"

    return {
        "id": str(rec.id),
        "employeeId": str(rec.employee_id),
        "employeeName": emp_name,
        "date": str(rec.date),
        "clockIn": rec.check_in_time.strftime("%H:%M") if rec.check_in_time else None,
        "clockOut": rec.check_out_time.strftime("%H:%M") if rec.check_out_time else None,
        "status": rec.status or "Present",
        "approvalStatus": rec.approval_status or "Pending_Manager"
    }


class UpdateAttendanceRequest(BaseModel):
    approvalStatus: Optional[str] = None
    clockOut: Optional[str] = None
    status: Optional[str] = None


@router.put("/attendance/{record_id}")
def update_attendance(
    record_id: str,
    payload: UpdateAttendanceRequest = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Update attendance record.
    Employees can update their own attendance (clock out).
    Manager can verify attendance for their direct reports (changes status from Pending_Manager to Pending_Admin).
    Admin can approve attendance (changes status to Approved).
    """
    rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.id == int(record_id)
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    employee = db.query(models.Employee).filter(models.Employee.id == rec.employee_id).first()
    
    # Employees can only update their own records (for clock out)
    if user.role == models.RoleEnum.employee:
        if rec.employee_id != user.id:
            raise HTTPException(status_code=403, detail="You can only update your own attendance")
        # Employee can only update clock out, not approval status
        if payload and payload.approvalStatus:
            raise HTTPException(status_code=403, detail="Employees cannot change approval status")
    elif user.role == models.RoleEnum.manager:
        # Manager updating their own record (clock out) - allow it
        if rec.employee_id == user.id:
            pass  # Allow manager to clock out their own record
        # Manager can only verify attendance for their direct reports
        elif payload and payload.approvalStatus:
            if employee and employee.manager_id != user.id:
                raise HTTPException(status_code=403, detail="You can only verify attendance for your direct reports")
            # Manager can only change from Pending_Manager to Pending_Admin
            if rec.approval_status != "Pending_Manager":
                raise HTTPException(status_code=400, detail="This attendance record is not pending manager approval")
            rec.approval_status = "Pending_Admin"
    elif user.role == models.RoleEnum.admin:
        # Admin can approve any attendance
        if payload and payload.approvalStatus:
            rec.approval_status = "Approved"
    
    # Update clock out time if provided (allowed for all users on their own records)
    if payload and payload.clockOut:
        clock_out_time = parse_clock_time(payload.clockOut, rec.date)
        if clock_out_time:
            rec.check_out_time = clock_out_time
    
    # Update status if provided
    if payload and payload.status:
        rec.status = payload.status
    
    db.commit()
    db.refresh(rec)
    
    emp_name = f"{employee.first_name} {employee.last_name}" if employee else "Unknown"
    
    return {
        "id": str(rec.id),
        "employeeId": str(rec.employee_id),
        "employeeName": emp_name,
        "date": str(rec.date),
        "clockIn": rec.check_in_time.strftime("%H:%M") if rec.check_in_time else None,
        "clockOut": rec.check_out_time.strftime("%H:%M") if rec.check_out_time else None,
        "status": rec.status or "Present",
        "approvalStatus": rec.approval_status,
        "message": "Attendance updated successfully"
    }


@router.delete("/attendance/{record_id}")
def delete_attendance(
    record_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Delete attendance record."""
    if user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can delete attendance records")

    rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.id == int(record_id)
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    db.delete(rec)
    db.commit()
    return {"message": "Attendance record deleted"}


# ============================================
# ATTENDANCE ENTRIES (LOGS) ENDPOINTS
# ============================================

class CreateAttendanceEntryRequest(BaseModel):
    entryType: str  # 'in' or 'out'
    reason: Optional[str] = None


@router.get("/attendance/{record_id}/entries")
def get_attendance_entries(
    record_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get all entries (check-in/check-out logs) for an attendance record."""
    rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.id == int(record_id)
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Check permissions - employee can only see their own, manager/admin can see all
    if user.role == models.RoleEnum.employee and rec.employee_id != user.id:
        raise HTTPException(status_code=403, detail="You can only view your own attendance entries")
    
    entries = db.query(models.AttendanceEntry).filter(
        models.AttendanceEntry.attendance_record_id == int(record_id)
    ).order_by(models.AttendanceEntry.timestamp.asc()).all()
    
    return [{
        "id": str(e.id),
        "attendanceRecordId": str(e.attendance_record_id),
        "entryType": e.entry_type,
        "timestamp": e.timestamp.strftime("%H:%M"),
        "reason": e.reason or ""
    } for e in entries]


@router.post("/attendance/{record_id}/entries")
def create_attendance_entry(
    record_id: str,
    payload: CreateAttendanceEntryRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Add a new check-in or check-out entry to an attendance record.
    This allows multiple check-ins and check-outs per day (e.g., for lunch breaks).
    """
    rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.id == int(record_id)
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Employee can only add entries to their own record
    if user.role == models.RoleEnum.employee and rec.employee_id != user.id:
        raise HTTPException(status_code=403, detail="You can only add entries to your own attendance")
    
    # Validate entry type
    if payload.entryType not in ('in', 'out'):
        raise HTTPException(status_code=400, detail="Entry type must be 'in' or 'out'")
    
    # Create the entry
    now = datetime.now()
    entry = models.AttendanceEntry(
        attendance_record_id=int(record_id),
        entry_type=payload.entryType,
        timestamp=now,
        reason=payload.reason
    )
    db.add(entry)
    
    # Update the main attendance record's check_out_time if this is a check-out
    if payload.entryType == 'out':
        rec.check_out_time = now
    
    db.commit()
    db.refresh(entry)
    
    return {
        "id": str(entry.id),
        "attendanceRecordId": str(entry.attendance_record_id),
        "entryType": entry.entry_type,
        "timestamp": entry.timestamp.strftime("%H:%M"),
        "reason": entry.reason or "",
        "message": f"Check-{payload.entryType} recorded successfully"
    }


@router.delete("/attendance/{record_id}/entries/{entry_id}")
def delete_attendance_entry(
    record_id: str,
    entry_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Delete an attendance entry."""
    if user.role not in (models.RoleEnum.admin, models.RoleEnum.manager):
        raise HTTPException(status_code=403, detail="Only admin or manager can delete attendance entries")
    
    entry = db.query(models.AttendanceEntry).filter(
        models.AttendanceEntry.id == int(entry_id),
        models.AttendanceEntry.attendance_record_id == int(record_id)
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Attendance entry not found")
    
    db.delete(entry)
    db.commit()
    return {"message": "Attendance entry deleted"}


@router.post("/attendance/{record_id}/confirm")
def confirm_attendance(
    record_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Confirm attendance record and submit for verification.
    Employee confirms their attendance log entries for the day,
    which then gets sent to their manager/admin for verification.
    """
    rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.id == int(record_id)
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Only the owner or admin can confirm
    if rec.employee_id != user.id and user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="You can only confirm your own attendance")
    
    if getattr(rec, 'is_confirmed', False):
        raise HTTPException(status_code=400, detail="Attendance already confirmed")
    
    # Must have at least one entry to confirm
    entries_count = db.query(models.AttendanceEntry).filter(
        models.AttendanceEntry.attendance_record_id == rec.id
    ).count()
    
    if entries_count == 0 and not rec.check_in_time:
        raise HTTPException(status_code=400, detail="No attendance entries to confirm")
    
    rec.is_confirmed = True
    rec.confirmed_at = datetime.utcnow()
    rec.approval_status = "Pending_Manager"
    db.commit()
    db.refresh(rec)
    
    return {
        "id": str(rec.id),
        "isConfirmed": True,
        "confirmedAt": rec.confirmed_at.strftime("%H:%M") if rec.confirmed_at else None,
        "message": "Attendance confirmed and submitted for verification"
    }


# ============================================
# LEAVE ENDPOINTS - Frontend Compatible
# ============================================

@router.get("/leave")
def get_all_leaves(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get all leave requests filtered by role.
    - Admin: sees all leaves
    - Manager: sees only leaves of their direct reports + their own
    - Employee: sees only their own leaves
    """
    query = db.query(models.LeaveRequest)
    
    if user.role == models.RoleEnum.admin:
        # Admin sees all
        leaves = query.order_by(models.LeaveRequest.applied_at.desc()).all()
    elif user.role == models.RoleEnum.manager:
        # Manager sees their subordinates' leaves + their own
        subordinate_ids = db.query(models.Employee.id).filter(
            models.Employee.manager_id == user.id
        ).all()
        subordinate_ids = [s[0] for s in subordinate_ids]
        subordinate_ids.append(user.id)  # Include manager's own leaves
        leaves = query.filter(
            models.LeaveRequest.employee_id.in_(subordinate_ids)
        ).order_by(models.LeaveRequest.applied_at.desc()).all()
    else:
        # Employee sees only their own
        leaves = query.filter_by(employee_id=user.id).order_by(
            models.LeaveRequest.applied_at.desc()
        ).all()

    result = []
    for lr in leaves:
        emp = db.query(models.Employee).filter(models.Employee.id == lr.employee_id).first()
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        days = (lr.end_date - lr.start_date).days + 1

        # Map status to frontend format
        status_map = {
            "pending": "Pending_Manager",
            "approved": "Approved",
            "rejected": "Rejected"
        }

        result.append({
            "id": str(lr.id),
            "employeeId": str(lr.employee_id),
            "employeeName": emp_name,
            "type": "Vacation",  # Default type
            "startDate": str(lr.start_date),
            "endDate": str(lr.end_date),
            "status": status_map.get(lr.status.value.lower(), "Pending_Manager"),
            "reason": lr.reason or "",
            "appliedDate": lr.applied_at.isoformat() if lr.applied_at else str(date.today()),
            "daysRequested": days
        })

    return result


@router.get("/leave/list")
def get_leave_list(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get list of leave requests filtered by role.
    - Admin: sees all leaves
    - Manager: sees only leaves of their direct reports
    - Employee: sees only their own leaves
    """
    query = db.query(models.LeaveRequest)

    # Filter by role
    if user.role == models.RoleEnum.employee:
        # Employees can only see their own leaves
        query = query.filter(models.LeaveRequest.employee_id == user.id)
    elif user.role == models.RoleEnum.manager:
        # Managers can only see leaves of employees reporting to them
        subordinate_ids = db.query(models.Employee.id).filter(
            models.Employee.manager_id == user.id
        ).all()
        subordinate_ids = [s[0] for s in subordinate_ids]
        # Include manager's own leaves too
        subordinate_ids.append(user.id)
        query = query.filter(models.LeaveRequest.employee_id.in_(subordinate_ids))
    # Admin sees all - no filter needed

    leaves = query.order_by(models.LeaveRequest.id.desc()).all()

    status_map = {
        "pending": "Pending_Manager",
        "approved": "Approved",
        "rejected": "Rejected"
    }

    result = []
    for lr in leaves:
        emp = db.query(models.Employee).filter(models.Employee.id == lr.employee_id).first()
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        days = (lr.end_date - lr.start_date).days + 1

        result.append({
            "id": str(lr.id),
            "employeeId": str(lr.employee_id),
            "employeeName": emp_name,
            "type": "Vacation",
            "startDate": str(lr.start_date),
            "endDate": str(lr.end_date),
            "status": status_map.get(lr.status.value.lower(), "Pending_Manager"),
            "reason": lr.reason or "",
            "appliedDate": lr.applied_at.isoformat() if lr.applied_at else str(date.today()),
            "daysRequested": days
        })

    return result


@router.post("/leave/apply")
def apply_leave_compat(
    payload: schemas.LeaveRequestCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Apply for leave - backend compatible endpoint."""
    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date")
    lr = models.LeaveRequest(
        employee_id=user.id,
        leave_type_id=payload.leave_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
        status=models.LeaveStatus.pending
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)
    return {
        "id": lr.id,
        "employee_id": lr.employee_id,
        "leave_type": {"id": lr.leave_type_id, "name": "Leave"},
        "start_date": str(lr.start_date),
        "end_date": str(lr.end_date),
        "status": lr.status.value.upper()
    }


@router.get("/leave/{leave_id}")
def get_leave_by_id(
    leave_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get leave request by ID."""
    lr = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == int(leave_id)
    ).first()

    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")

    emp = db.query(models.Employee).filter(models.Employee.id == lr.employee_id).first()
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    days = (lr.end_date - lr.start_date).days + 1

    status_map = {
        "pending": "Pending_Manager",
        "approved": "Approved",
        "rejected": "Rejected"
    }

    return {
        "id": str(lr.id),
        "employeeId": str(lr.employee_id),
        "employeeName": emp_name,
        "type": "Vacation",
        "startDate": str(lr.start_date),
        "endDate": str(lr.end_date),
        "status": status_map.get(lr.status.value.lower(), "Pending_Manager"),
        "reason": lr.reason or "",
        "appliedDate": lr.applied_at.isoformat() if lr.applied_at else str(date.today()),
        "daysRequested": days
    }


class CreateLeaveRequest(BaseModel):
    employeeId: Optional[str] = None
    type: str = "Vacation"
    startDate: str
    endDate: str
    reason: str


@router.post("/leave")
def create_leave(
    payload: CreateLeaveRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Create leave request."""
    start = date.fromisoformat(payload.startDate)
    end = date.fromisoformat(payload.endDate)

    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    lr = models.LeaveRequest(
        employee_id=user.id,
        leave_type_id=1,  # Default leave type
        start_date=start,
        end_date=end,
        reason=payload.reason,
        status=models.LeaveStatus.pending
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)

    days = (end - start).days + 1

    return {
        "id": str(lr.id),
        "employeeId": str(lr.employee_id),
        "employeeName": f"{user.first_name} {user.last_name}",
        "type": payload.type,
        "startDate": str(lr.start_date),
        "endDate": str(lr.end_date),
        "status": "Pending_Manager",
        "reason": lr.reason,
        "appliedDate": lr.applied_at.isoformat() if lr.applied_at else str(date.today()),
        "daysRequested": days
    }


@router.put("/leave/{leave_id}")
def update_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Update leave request - stub."""
    raise HTTPException(
        status_code=501,
        detail={
            "message": "Leave update not yet implemented",
            "expected_request": {
                "type": "Sick|Vacation|Personal",
                "startDate": "YYYY-MM-DD",
                "endDate": "YYYY-MM-DD",
                "reason": "string"
            }
        }
    )


@router.delete("/leave/{leave_id}")
def delete_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Delete/cancel leave request."""
    lr = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == int(leave_id)
    ).first()

    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if lr.employee_id != user.id and user.role == models.RoleEnum.employee:
        raise HTTPException(status_code=403, detail="Cannot delete others' leave requests")

    if lr.status != models.LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Can only delete pending leave requests")

    db.delete(lr)
    db.commit()
    return {"message": "Leave request deleted"}


@router.post("/leave/{leave_id}/approve")
def approve_leave_post(
    leave_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Approve leave - POST version for frontend compatibility.
    Frontend uses POST, backend has PUT.
    Managers can only approve leaves for their direct reports.
    Admins can approve any leave.
    Also decreases the employee's leave balance.
    """
    if user.role not in (models.RoleEnum.admin, models.RoleEnum.manager):
        raise HTTPException(status_code=403, detail="Only admin/manager can approve")

    try:
        leave_id_int = int(leave_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid leave ID")

    lr = db.query(models.LeaveRequest).filter_by(id=leave_id_int).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if lr.status != models.LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Leave request not pending")

    # Check if manager can approve this leave (must be their direct report)
    if user.role == models.RoleEnum.manager:
        employee = db.query(models.Employee).filter_by(id=lr.employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        if employee.manager_id != user.id:
            raise HTTPException(status_code=403, detail="You can only approve leaves for your direct reports")

    # Calculate days requested
    days_requested = (lr.end_date - lr.start_date).days + 1

    # Update leave balance
    current_year = date.today().year
    leave_balance = db.query(models.LeaveBalance).filter_by(
        employee_id=lr.employee_id,
        year=current_year
    ).first()

    if leave_balance:
        leave_balance.used_leaves += days_requested
        leave_balance.remaining_leaves = leave_balance.total_leaves - leave_balance.used_leaves
    else:
        # Create leave balance if it doesn't exist
        leave_balance = models.LeaveBalance(
            employee_id=lr.employee_id,
            year=current_year,
            total_leaves=17,
            used_leaves=days_requested,
            remaining_leaves=17 - days_requested
        )
        db.add(leave_balance)

    lr.status = models.LeaveStatus.approved
    lr.reviewed_by = user.id
    lr.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(lr)

    return {
        "id": str(lr.id),
        "status": "Approved",
        "message": "Leave approved successfully"
    }


@router.post("/leave/{leave_id}/reject")
def reject_leave_post(
    leave_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Reject leave - POST version for frontend compatibility.
    Managers can only reject leaves for their direct reports.
    Admins can reject any leave.
    """
    if user.role not in (models.RoleEnum.admin, models.RoleEnum.manager):
        raise HTTPException(status_code=403, detail="Only admin/manager can reject")

    lr = db.query(models.LeaveRequest).filter_by(id=int(leave_id)).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Check if manager can reject this leave (must be their direct report)
    if user.role == models.RoleEnum.manager:
        employee = db.query(models.Employee).filter_by(id=lr.employee_id).first()
        if employee and employee.manager_id != user.id:
            raise HTTPException(status_code=403, detail="You can only reject leaves for your direct reports")

    lr.status = models.LeaveStatus.rejected
    lr.reviewed_by = user.id
    lr.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(lr)

    return {
        "id": str(lr.id),
        "status": "Rejected",
        "message": "Leave rejected"
    }


# ============================================
# HOLIDAYS ENDPOINTS - Frontend Compatible
# ============================================

@router.get("/holidays")
def get_all_holidays(db: Session = Depends(get_db)):
    """Get all holidays in frontend format."""
    holidays = db.query(models.Holiday).order_by(models.Holiday.date).all()

    return [
        {
            "id": str(h.id),
            "name": h.name,
            "date": str(h.date),
            "type": "Public"  # Default type
        }
        for h in holidays
    ]


@router.get("/holidays/list")
def get_holidays_list(db: Session = Depends(get_db)):
    """Get all holidays - backend compatible endpoint."""
    return db.query(models.Holiday).order_by(models.Holiday.date).all()


@router.post("/holidays/create")
def create_holiday_compat(
    payload: schemas.HolidayCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Create holiday - backend compatible endpoint."""
    if user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can create holidays")
    h = models.Holiday(name=payload.name, date=payload.date, description=payload.description)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.get("/holidays/{holiday_id}")
def get_holiday_by_id(holiday_id: str, db: Session = Depends(get_db)):
    """Get holiday by ID."""
    h = db.query(models.Holiday).filter(models.Holiday.id == int(holiday_id)).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holiday not found")

    return {
        "id": str(h.id),
        "name": h.name,
        "date": str(h.date),
        "type": "Public"
    }


class CreateHolidayRequest(BaseModel):
    name: str
    date: str
    type: str = "Public"


@router.post("/holidays")
def create_holiday(
    payload: CreateHolidayRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Create holiday."""
    if user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can create holidays")

    h = models.Holiday(
        name=payload.name,
        date=date.fromisoformat(payload.date),
        description=""
    )
    db.add(h)
    db.commit()
    db.refresh(h)

    return {
        "id": str(h.id),
        "name": h.name,
        "date": str(h.date),
        "type": payload.type
    }


@router.put("/holidays/{holiday_id}")
def update_holiday(
    holiday_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Update holiday - stub."""
    raise HTTPException(
        status_code=501,
        detail={
            "message": "Holiday update not yet implemented",
            "expected_request": {
                "name": "string",
                "date": "YYYY-MM-DD",
                "type": "Public|Company"
            }
        }
    )


@router.delete("/holidays/{holiday_id}")
def delete_holiday(
    holiday_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Delete holiday."""
    if user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can delete holidays")

    h = db.query(models.Holiday).filter(models.Holiday.id == int(holiday_id)).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holiday not found")

    db.delete(h)
    db.commit()
    return {"message": "Holiday deleted"}


# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Get dashboard statistics.
    Returns summary data for the dashboard.
    """
    today = date.today()

    # Count employees
    total_employees = db.query(models.Employee).count()

    # Count today's attendance
    today_attendance = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.date == today
    ).count()

    # Count pending leaves
    pending_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == models.LeaveStatus.pending
    ).count()

    # Count upcoming holidays
    upcoming_holidays = db.query(models.Holiday).filter(
        models.Holiday.date >= today
    ).count()

    return {
        "totalEmployees": total_employees,
        "presentToday": today_attendance,
        "pendingLeaves": pending_leaves,
        "upcomingHolidays": upcoming_holidays,
        "date": str(today)
    }
