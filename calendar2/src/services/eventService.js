import { apiEvent } from "./api"; 

export const eventService = {
  async getEvents(params = {}) {
    const response = await apiEvent.get('/events', { params });
    return response.data;
  },

  async getEvent(id) {
    const response = await apiEvent.get(`/events/${id}`);
    return response.data;
  },

  async createEvent(eventData) {
    const response = await apiEvent.post('/events', eventData);
    return response.data;
  },

  async updateEvent(id, eventData) {
    const response = await apiEvent.put(`/events/${id}`, eventData);
    return response.data;
  },

  async deleteEvent(id) {
    const response = await apiEvent.delete(`/events/${id}`);
    return response.data;
  },
};

