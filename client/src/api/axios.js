import axios from 'axios';

const api = axios.create({
  // Relies entirely on Vercel environment variables or local .env file
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('evergreen_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — force logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('evergreen_token');
      localStorage.removeItem('evergreen_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
