import api from './axios';

export const memberLogin   = (data) => api.post('/auth/member/login', data);
export const leaderLogin   = (data) => api.post('/auth/leader/login', data);
export const superAdminLogin = (data) => api.post('/auth/superadmin/login', data);
