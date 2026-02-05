// API Configuration for FastAPI Backend
// Update API_BASE_URL to match your FastAPI server URL
// 
// In development (npm run dev): Set VITE_API_BASE_URL=/api (uses vite proxy)
// In production (Docker): Set VITE_API_BASE_URL=/api (uses nginx proxy)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  
  // Attendance
  ATTENDANCE: '/attendance',
  ATTENDANCE_BY_ID: (id: string) => `/attendance/${id}`,
  MARK_ATTENDANCE: '/attendance/mark',
  ATTENDANCE_ENTRIES: (recordId: string) => `/attendance/${recordId}/entries`,
  ATTENDANCE_ENTRY_BY_ID: (recordId: string, entryId: string) => `/attendance/${recordId}/entries/${entryId}`,
  ATTENDANCE_CONFIRM: (recordId: string) => `/attendance/${recordId}/confirm`,
  
  // Leave
  LEAVE_REQUESTS: '/leave',
  LEAVE_REQUEST_BY_ID: (id: string) => `/leave/${id}`,
  APPROVE_LEAVE: (id: string) => `/leave/${id}/approve`,
  REJECT_LEAVE: (id: string) => `/leave/${id}/reject`,
  
  // Holidays
  HOLIDAYS: '/holidays',
  HOLIDAY_BY_ID: (id: string) => `/holidays/${id}`,
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
};

// API Helper Functions
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export const api = {
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint: string, data: any) => 
    apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) => 
    apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};
