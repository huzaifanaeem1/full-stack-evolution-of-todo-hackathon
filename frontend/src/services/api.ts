import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Task, TaskCreate, TaskUpdate, TaskPatch, User, UserCreate, UserLogin } from '@/src/types';
import { getAuthToken, isAuthenticated } from './auth';

// Base API client with default configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to all requests (except auth endpoints)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't attach token to auth endpoints (login, register)
    const isAuthEndpoint = config.url?.includes('/auth');

    if (!isAuthEndpoint && isAuthenticated()) {
      const token = getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle specific error responses
    if (error.response?.status === 401) {
      // Token might be expired, redirect to login
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Handle forbidden access (cross-user access attempt)
      console.error('Access forbidden:', error.response.data.detail);
    }

    return Promise.reject(error);
  }
);

// Authentication API functions
export const authAPI = {
  register: async (userData: UserCreate): Promise<User> => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Registration failed');
    }
  },

  login: async (credentials: UserLogin): Promise<{ user: User; token: string }> => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user, token } = response.data;

      // Store token and user ID in localStorage
      if (token && user.id) {
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user_id', user.id);
      }

      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get user profile');
    }
  }
};

// Task API functions
export const taskAPI = {
  getTasks: async (userId: string): Promise<Task[]> => {
    try {
      const response = await apiClient.get(`/${userId}/tasks`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch tasks');
    }
  },

  createTask: async (userId: string, taskData: TaskCreate): Promise<Task> => {
    try {
      const response = await apiClient.post(`/${userId}/tasks`, taskData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to create task');
    }
  },

  getTask: async (userId: string, taskId: string): Promise<Task> => {
    try {
      const response = await apiClient.get(`/${userId}/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch task');
    }
  },

  updateTask: async (userId: string, taskId: string, taskData: TaskUpdate): Promise<Task> => {
    try {
      const response = await apiClient.put(`/${userId}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to update task');
    }
  },

  patchTaskCompletion: async (userId: string, taskId: string, taskPatch: TaskPatch): Promise<Task> => {
    try {
      const response = await apiClient.patch(`/${userId}/tasks/${taskId}/complete`, taskPatch);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to update task completion');
    }
  },

  deleteTask: async (userId: string, taskId: string): Promise<void> => {
    try {
      await apiClient.delete(`/${userId}/tasks/${taskId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to delete task');
    }
  }
};

export default apiClient;