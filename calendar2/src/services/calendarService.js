import api from './api.js';

export const calendarService = {
  async getCalendars() {
    const response = await api.get('/calendars');
    return response.data;
  },

  async createCalendar(calendarData) {
    const response = await api.post('/calendars', calendarData);
    return response.data;
  },

  async updateCalendar(id, calendarData) {
    const response = await api.put(`/calendars/${id}`, calendarData);
    return response.data;
  },

  async deleteCalendar(id) {
    const response = await api.delete(`/calendars/${id}`);
    return response.data;
  },
};

