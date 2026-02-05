import { api, API_ENDPOINTS } from '../config/api';
import { Holiday } from '../types';

export interface CreateHolidayRequest {
  name: string;
  date: string;
  type: 'Public' | 'Company';
}

export interface UpdateHolidayRequest {
  name?: string;
  date?: string;
  type?: 'Public' | 'Company';
}

export const holidayService = {
  /**
   * Get all holidays
   * FastAPI endpoint: GET /holidays
   */
  getAllHolidays: async (): Promise<Holiday[]> => {
    return await api.get(API_ENDPOINTS.HOLIDAYS);
  },

  /**
   * Get holiday by ID
   * FastAPI endpoint: GET /holidays/{id}
   */
  getHolidayById: async (id: string): Promise<Holiday> => {
    return await api.get(API_ENDPOINTS.HOLIDAY_BY_ID(id));
  },

  /**
   * Create holiday
   * FastAPI endpoint: POST /holidays
   */
  createHoliday: async (data: CreateHolidayRequest): Promise<Holiday> => {
    return await api.post(API_ENDPOINTS.HOLIDAYS, data);
  },

  /**
   * Update holiday
   * FastAPI endpoint: PUT /holidays/{id}
   */
  updateHoliday: async (id: string, data: UpdateHolidayRequest): Promise<Holiday> => {
    return await api.put(API_ENDPOINTS.HOLIDAY_BY_ID(id), data);
  },

  /**
   * Delete holiday
   * FastAPI endpoint: DELETE /holidays/{id}
   */
  deleteHoliday: async (id: string): Promise<void> => {
    return await api.delete(API_ENDPOINTS.HOLIDAY_BY_ID(id));
  },

  /**
   * Get holidays by year
   */
  getHolidaysByYear: async (year: number): Promise<Holiday[]> => {
    const holidays = await api.get(API_ENDPOINTS.HOLIDAYS);
    return holidays.filter((holiday: Holiday) => {
      const holidayYear = new Date(holiday.date).getFullYear();
      return holidayYear === year;
    });
  },

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays: async (): Promise<Holiday[]> => {
    const holidays = await api.get(API_ENDPOINTS.HOLIDAYS);
    const today = new Date().toISOString().split('T')[0];
    return holidays.filter((holiday: Holiday) => holiday.date >= today);
  },
};
