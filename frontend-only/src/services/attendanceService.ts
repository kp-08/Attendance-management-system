import { api, API_ENDPOINTS } from '../config/api';
import { AttendanceRecord } from '../types';

export interface MarkAttendanceRequest {
  employeeId: string;
  clockIn: string;
  clockOut?: string;
  status: 'Present' | 'Late' | 'Absent' | 'Holiday';
}

export interface UpdateAttendanceRequest {
  clockOut?: string;
  status?: 'Present' | 'Late' | 'Absent' | 'Holiday';
  approvalStatus?: 'Pending_Manager' | 'Pending_Admin' | 'Approved' | 'Rejected';
}

export const attendanceService = {
  /**
   * Get all attendance records
   * FastAPI endpoint: GET /attendance
   */
  getAllAttendance: async (): Promise<AttendanceRecord[]> => {
    return await api.get(API_ENDPOINTS.ATTENDANCE);
  },

  /**
   * Get attendance by ID
   * FastAPI endpoint: GET /attendance/{id}
   */
  getAttendanceById: async (id: string): Promise<AttendanceRecord> => {
    return await api.get(API_ENDPOINTS.ATTENDANCE_BY_ID(id));
  },

  /**
   * Get attendance by employee ID
   */
  getAttendanceByEmployeeId: async (employeeId: string): Promise<AttendanceRecord[]> => {
    const records = await api.get(API_ENDPOINTS.ATTENDANCE);
    return records.filter((record: AttendanceRecord) => record.employeeId === employeeId);
  },

  /**
   * Get attendance by date range
   */
  getAttendanceByDateRange: async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    const records = await api.get(API_ENDPOINTS.ATTENDANCE);
    return records.filter((record: AttendanceRecord) => {
      return record.date >= startDate && record.date <= endDate;
    });
  },

  /**
   * Mark attendance (clock in/out)
   * FastAPI endpoint: POST /attendance/mark
   */
  markAttendance: async (data: MarkAttendanceRequest): Promise<AttendanceRecord> => {
    return await api.post(API_ENDPOINTS.MARK_ATTENDANCE, data);
  },

  /**
   * Update attendance record
   * FastAPI endpoint: PUT /attendance/{id}
   */
  updateAttendance: async (id: string, data: UpdateAttendanceRequest): Promise<AttendanceRecord> => {
    return await api.put(API_ENDPOINTS.ATTENDANCE_BY_ID(id), data);
  },

  /**
   * Delete attendance record
   * FastAPI endpoint: DELETE /attendance/{id}
   */
  deleteAttendance: async (id: string): Promise<void> => {
    return await api.delete(API_ENDPOINTS.ATTENDANCE_BY_ID(id));
  },

  /**
   * Get today's attendance for an employee
   */
  getTodayAttendance: async (employeeId: string): Promise<AttendanceRecord | null> => {
    const today = new Date().toISOString().split('T')[0];
    const records = await api.get(API_ENDPOINTS.ATTENDANCE);
    const todayRecord = records.find(
      (record: AttendanceRecord) => 
        record.employeeId === employeeId && record.date === today
    );
    return todayRecord || null;
  },

  /**
   * Get pending attendance approvals
   */
  getPendingApprovals: async (): Promise<AttendanceRecord[]> => {
    const records = await api.get(API_ENDPOINTS.ATTENDANCE);
    return records.filter(
      (record: AttendanceRecord) => 
        record.approvalStatus === 'Pending_Manager' || 
        record.approvalStatus === 'Pending_Admin'
    );
  },

  /**
   * Add multiple check-in/out entry
   * FastAPI endpoint: POST /attendance/{id}/entries
   */
  addAttendanceEntry: async (recordId: string, entryType: 'in' | 'out', reason?: string): Promise<any> => {
    return await api.post(API_ENDPOINTS.ATTENDANCE_ENTRIES(recordId), {
      entryType,
      reason
    });
  },

  /**
   * Get all entries for an attendance record
   * FastAPI endpoint: GET /attendance/{id}/entries
   */
  getAttendanceEntries: async (recordId: string): Promise<any[]> => {
    return await api.get(API_ENDPOINTS.ATTENDANCE_ENTRIES(recordId));
  },

  /**
   * Delete an attendance entry
   * FastAPI endpoint: DELETE /attendance/{id}/entries/{entryId}
   */
  deleteAttendanceEntry: async (recordId: string, entryId: string): Promise<void> => {
    return await api.delete(API_ENDPOINTS.ATTENDANCE_ENTRY_BY_ID(recordId, entryId));
  },

  /**
   * Confirm attendance and submit for verification
   * FastAPI endpoint: POST /attendance/{id}/confirm
   */
  confirmAttendance: async (recordId: string): Promise<any> => {
    return await api.post(API_ENDPOINTS.ATTENDANCE_CONFIRM(recordId), {});
  },
};
