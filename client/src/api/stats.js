import api from './axios';

export const getFundsOverview = () => api.get('/stats/funds');
export const getUnpaidMembers = () => api.get('/stats/unpaid');
export const getDeactivatedMembers = () => api.get('/stats/deactivated');
