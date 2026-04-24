import API from './api';

export const getRules = () => API.get('/rules');
export const createRule = (data) => API.post('/rules', data);
export const updateRule = (id, data) => API.put(`/rules/${id}`, data);
export const deleteRule = (id) => API.delete(`/rules/${id}`);
