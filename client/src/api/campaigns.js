import api from './axios';

export const getActiveCampaign = () => api.get('/campaigns/active');
export const getCampaignHistory = () => api.get('/campaigns/history');
export const getAllCampaigns = () => api.get('/campaigns');
export const createCampaign = (data) => api.post('/campaigns', data);
export const completeCampaign = (id, data) => api.post(`/campaigns/${id}/complete`, data);
