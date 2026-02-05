import { api, API_ENDPOINTS } from '../config/api';
import { LeaveRequest } from '../types';

export interface CreateLeaveRequest {
  employeeId: string;
  type: 'Sick' | 'Vacation' | 'Personal';
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveRequest {
  type?: 'Sick' | 'Vacation' | 'Personal';
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: 'Pending_Manager' | 'Pending_Admin' | 'Approved' | 'Rejected';
}

export const leaveService = {
  /**
   * Get all leave requests
   * FastAPI endpoint: GET /leave
   */
  getAllLeaveRequests: async (): Promise<LeaveRequest[]> => {
    return await api.get(API_ENDPOINTS.LEAVE_REQUESTS);
  },

  /**
   * Get leave request by ID
   * FastAPI endpoint: GET /leave/{id}
   */
  getLeaveRequestById: async (id: string): Promise<LeaveRequest> => {
    return await api.get(API_ENDPOINTS.LEAVE_REQUEST_BY_ID(id));
  },

  /**
   * Get leave requests by employee ID
   */
  getLeaveRequestsByEmployeeId: async (employeeId: string): Promise<LeaveRequest[]> => {
    const requests = await api.get(API_ENDPOINTS.LEAVE_REQUESTS);
    return requests.filter((request: LeaveRequest) => request.employeeId === employeeId);
  },

  /**
   * Create leave request
   * FastAPI endpoint: POST /leave
   */
  createLeaveRequest: async (data: CreateLeaveRequest): Promise<LeaveRequest> => {
    return await api.post(API_ENDPOINTS.LEAVE_REQUESTS, data);
  },

  /**
   * Update leave request
   * FastAPI endpoint: PUT /leave/{id}
   */
  updateLeaveRequest: async (id: string, data: UpdateLeaveRequest): Promise<LeaveRequest> => {
    return await api.put(API_ENDPOINTS.LEAVE_REQUEST_BY_ID(id), data);
  },

  /**
   * Delete leave request
   * FastAPI endpoint: DELETE /leave/{id}
   */
  deleteLeaveRequest: async (id: string): Promise<void> => {
    return await api.delete(API_ENDPOINTS.LEAVE_REQUEST_BY_ID(id));
  },

  /**
   * Approve leave request
   * FastAPI endpoint: POST /leave/{id}/approve
   */
  approveLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    return await api.post(API_ENDPOINTS.APPROVE_LEAVE(id), {});
  },

  /**
   * Reject leave request
   * FastAPI endpoint: POST /leave/{id}/reject
   */
  rejectLeaveRequest: async (id: string, reason?: string): Promise<LeaveRequest> => {
    return await api.post(API_ENDPOINTS.REJECT_LEAVE(id), { reason });
  },

  /**
   * Get pending leave requests
   */
  getPendingLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const requests = await api.get(API_ENDPOINTS.LEAVE_REQUESTS);
    return requests.filter(
      (request: LeaveRequest) => 
        request.status === 'Pending_Manager' || 
        request.status === 'Pending_Admin'
    );
  },

  /**
   * Get approved leave requests
   */
  getApprovedLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const requests = await api.get(API_ENDPOINTS.LEAVE_REQUESTS);
    return requests.filter((request: LeaveRequest) => request.status === 'Approved');
  },
};
