import api from './axios';

export const getSettings = () => api.get('/settings');
export const updateMinContribution = (value) => api.put('/settings/min-contribution', { value });
