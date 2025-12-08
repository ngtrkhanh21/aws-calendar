import { apiTodo } from "./api"; 

export const calendarService = {
  async getCalendars() {
    const response = await apiTodo.get('/todos');
    return response.data;
  },

  async createCalendar(calendarData) {
    const response = await apiTodo.post('/todos', calendarData);
    return response.data;
  },

  async updateCalendar(id, calendarData) {
    const response = await apiTodo.put(`/todos/${id}`, calendarData);
    return response.data;
  },

  async deleteCalendar(id) {
    const response = await apiTodo.delete(`/todos/${id}`);
    return response.data;
  },
};

