import axios from 'axios';

const API_URL_EVENT = import.meta.env.VITE_API_URL_1 || 'https://zpq60ia453.execute-api.ap-southeast-1.amazonaws.com/';
const API_URL_TODO = import.meta.env.VITE_API_URL_2 || 'https://wb2s9crxy5.execute-api.ap-southeast-1.amazonaws.com/';

// Helper function to create axios instance with interceptors
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Just reject the error, no redirects needed
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create two separate API instances
export const apiEvent = createApiInstance(API_URL_EVENT);
export const apiTodo = createApiInstance(API_URL_TODO);

// Export default for backwards compatibility
export default apiEvent;

