import api from './axios';

export const getClaims       = (params) => api.get('/claims', { params });
export const getMyClaims     = ()       => api.get('/claims/my');
export const createClaim     = (data)   => api.post('/claims', data);
export const updateClaimStatus = (id, data) => api.patch(`/claims/${id}/status`, data);
export const deleteClaim     = (id)     => api.delete(`/claims/${id}`);
