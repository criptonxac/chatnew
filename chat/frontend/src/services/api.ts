import axios from 'axios';

const API_URL = 'http://localhost:8005';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request:', config.url);
    } else {
      console.warn('No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Conversation API
export const getConversations = () => {
  return api.get('/api/chat/conversations');
};

export const getConversation = (id: number) => {
  return api.get(`/api/chat/conversations/${id}`);
};

export const createConversation = (data: { name?: string; is_group: boolean; participant_ids: number[] }) => {
  return api.post('/api/chat/conversations', data);
};

// Messages API
export const getMessages = (conversationId: number) => {
  return api.get(`/api/chat/conversations/${conversationId}/messages`);
};

export const sendMessage = (data: { conversation_id: number; content: string; file_url?: string; file_name?: string; file_type?: string }) => {
  return api.post('/api/chat/messages', data);
};

// Files API
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// User API
export const getUsers = () => {
  return api.get('/api/users');
};

export const searchUsers = (query: string) => {
  return api.get(`/api/chat/users/search?query=${query}`);
};

export const getUser = (id: number) => {
  return api.get(`/api/users/${id}`);
};

// WebSocket connection helper
export const getWebSocketUrl = (conversationId: number) => {
  const token = localStorage.getItem('token');
  return `ws://localhost:8005/ws/chat/${conversationId}?token=${token}`;
};

export default api;
