import api from './axios';

export const getChangeRequests   = (params) => api.get('/change-requests', { params });
export const getChangeRequestById = (id)    => api.get(`/change-requests/${id}`);
export const createChangeRequest = (data)   => api.post('/change-requests', data);
export const voteOnChangeRequest = (id, data) => api.post(`/change-requests/${id}/vote`, data);
export const validateSession     = ()       => api.get('/change-requests/validate');
