import { api, API_ENDPOINTS } from '../config/api';
import { User, UserRole } from '../types';

export interface CreateUserRequest {
  name: string;
  email: string;
  personalEmail: string;
  password: string;
  role: UserRole;
  department: string;
  phone?: string;
  reportingTo?: string;
  assignedAdminId?: string;
  assignedProject?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  personalEmail?: string;
  role?: UserRole;
  department?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  reportingTo?: string;
  assignedAdminId?: string;
  assignedProject?: string;
  leaveBalance?: number;
}

export const userService = {
  /**
   * Get all users
   * FastAPI endpoint: GET /users
   */
  getAllUsers: async (): Promise<User[]> => {
    return await api.get(API_ENDPOINTS.USERS);
  },

  /**
   * Get user by ID
   * FastAPI endpoint: GET /users/{id}
   */
  getUserById: async (id: string): Promise<User> => {
    return await api.get(API_ENDPOINTS.USER_BY_ID(id));
  },

  /**
   * Create new user
   * FastAPI endpoint: POST /users
   */
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    return await api.post(API_ENDPOINTS.USERS, userData);
  },

  /**
   * Update user
   * FastAPI endpoint: PUT /users/{id}
   */
  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    return await api.put(API_ENDPOINTS.USER_BY_ID(id), userData);
  },

  /**
   * Delete user
   * FastAPI endpoint: DELETE /users/{id}
   */
  deleteUser: async (id: string): Promise<void> => {
    return await api.delete(API_ENDPOINTS.USER_BY_ID(id));
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (role: UserRole): Promise<User[]> => {
    const users = await api.get(API_ENDPOINTS.USERS);
    return users.filter((user: User) => user.role === role);
  },

  /**
   * Get users by department
   */
  getUsersByDepartment: async (department: string): Promise<User[]> => {
    const users = await api.get(API_ENDPOINTS.USERS);
    return users.filter((user: User) => user.department === department);
  },

  /**
   * Get subordinates for a manager
   */
  getSubordinates: async (managerId: string): Promise<User[]> => {
    const users = await api.get(API_ENDPOINTS.USERS);
    return users.filter((user: User) => user.reportingTo === managerId);
  },
};
