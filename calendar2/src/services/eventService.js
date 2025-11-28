import api from './api.js';

export const eventService = {
  async getEvents(params = {}) {
    const response = await api.get('/events', { params });
    return response.data;
  },

  async getEvent(id) {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  async createEvent(eventData) {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  async updateEvent(id, eventData) {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  async deleteEvent(id) {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

