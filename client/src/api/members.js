import api from './axios';

export const getMembers     = ()       => api.get('/members');
export const getMemberById  = (id)     => api.get(`/members/${id}`);
export const getMyProfile   = ()       => api.get('/members/me');
export const createMember   = (data)   => api.post('/members', data);
export const updateMember   = (id, data) => api.put(`/members/${id}`, data);
export const updateMemberPhoto = (id, formData) =>
  api.patch(`/members/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteMember   = (id)     => api.delete(`/members/${id}`);
