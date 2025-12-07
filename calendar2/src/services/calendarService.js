import api from './api.js';

export const calendarService = {
  async getCalendars() {
    const response = await api.get('/todos');
    return response.data;
  },

  async createCalendar(calendarData) {
    const response = await api.post('/todos', calendarData);
    return response.data;
  },

  async updateCalendar(id, calendarData) {
    const response = await api.put(`/todos/${id}`, calendarData);
    return response.data;
  },

  async deleteCalendar(id) {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  },
};

