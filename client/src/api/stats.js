import api from './axios';

export const getFundsOverview = () => api.get('/stats/funds');
export const getDefaulters    = () => api.get('/stats/defaulters');
