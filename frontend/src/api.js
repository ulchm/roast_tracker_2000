/**
 * API service for communicating with Django backend
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (expired token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens (App will detect and show login)
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Roast API endpoints
 */
export const roastAPI = {
  // Get all roasts with optional filters
  getAll: (params = {}) => {
    return api.get('/roasts/', { params });
  },

  // Get a single roast by ID
  getById: (id) => {
    return api.get(`/roasts/${id}/`);
  },

  // Upload new roast (alog + image)
  upload: (formData) => {
    return api.post('/roasts/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Search roasts
  search: (searchTerm) => {
    return api.get('/roasts/', {
      params: { search: searchTerm },
    });
  },

  // Delete roast
  delete: (id) => {
    return api.delete(`/roasts/${id}/`);
  },
};

export default api;
