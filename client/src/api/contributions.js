import api from './axios';

export const getContributions    = (params) => api.get('/contributions', { params });
export const getMyContributions  = ()       => api.get('/contributions/my');
export const getContributionSummary = ()    => api.get('/contributions/summary');
export const addContribution     = (data)   => api.post('/contributions', data);
export const updateContribution  = (id, data) => api.put(`/contributions/${id}`, data);
export const deleteContribution  = (id)    => api.delete(`/contributions/${id}`);
