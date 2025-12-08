import { apiTodo } from './api';

export const todoService = {
  async getTodos(params = {}) {
    const res = await apiTodo.get('/todos', { params });
    return res.data;
  },

  async createTodo(payload) {
    const res = await apiTodo.post('/todos', payload);
    return res.data;
  },

  async updateTodo(id, payload) {
    const res = await apiTodo.put(`/todos/${id}`, payload);
    return res.data;
  },

  async deleteTodo(id) {
    const res = await apiTodo.delete(`/todos/${id}`);
    return res.data;
  },
};



