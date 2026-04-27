import api from './axios';

export const getMissionVision = () => api.get('/mission-vision');
export const updateMissionVision = (data) => api.post('/mission-vision', data);
