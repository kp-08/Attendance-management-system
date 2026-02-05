
export enum UserRole {
  ADMIN_MASTER = 'ADMIN_MASTER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  personalEmail: string;
  password?: string;
  role: UserRole;
  department: string;
  leaveBalance: number;
  phone?: string;
  joinDate?: string;
  status: 'Active' | 'Inactive';
  loginCount: number;
  passwordChanged: boolean;
  reportingTo?: string; // Manager ID
  reportingManagerName?: string;
  assignedAdminId?: string; // Admin ID responsible for this node
  assignedProject?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: 'Present' | 'Late' | 'Absent' | 'Holiday';
  approvalStatus: 'Pending_Manager' | 'Pending_Admin' | 'Approved' | 'Rejected';
  entriesCount?: number;  // Number of check-in/check-out entries
  isConfirmed?: boolean;  // Whether attendance is confirmed and submitted for verification
  confirmedAt?: string;   // Time when attendance was confirmed
}

export interface AttendanceEntry {
  id: string;
  attendanceRecordId: string;
  entryType: 'in' | 'out';
  timestamp: string;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Sick' | 'Vacation' | 'Personal';
  startDate: string;
  endDate: string;
  status: 'Pending_Manager' | 'Pending_Admin' | 'Approved' | 'Rejected';
  reason: string;
  appliedDate: string;
  daysRequested: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Company';
}

export interface ProjectProposal {
  id: string;
  projectName: string;
  managerId: string;
  managerName: string;
  employeeIds: string[];
  status: 'Pending_Admin' | 'Approved';
  timestamp: string;
}
