import api from './axios';

export const getFundsOverview = () => api.get('/stats/funds');
export const getUnpaidMembers = () => api.get('/stats/unpaid');
