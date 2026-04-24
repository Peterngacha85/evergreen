import api from './axios';

export const getLeaders    = ()         => api.get('/leaders');
export const getLeaderById = (id)       => api.get(`/leaders/${id}`);
export const createLeader  = (formData) => api.post('/leaders', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateLeader  = (id, formData) => api.put(`/leaders/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteLeader  = (id)       => api.delete(`/leaders/${id}`);
