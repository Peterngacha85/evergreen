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
      // Don't logout if it's a password update error (user just entered wrong current password)
      const isPasswordUpdate = err.config.url.includes('/password');
      
      if (!isPasswordUpdate) {
        localStorage.removeItem('evergreen_token');
        localStorage.removeItem('evergreen_user');
        window.location.href = '/login';
      }
    }

    // A member deactivated while logged in is sent back to the login page,
    // which explains why (the login request itself shows the dialog directly)
    if (err.response?.status === 403 && err.response.data?.code === 'ACCOUNT_DEACTIVATED' && !err.config.url.includes('/login')) {
      localStorage.removeItem('evergreen_token');
      localStorage.removeItem('evergreen_user');
      sessionStorage.setItem('evergreen_deactivated', JSON.stringify(err.response.data));
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
