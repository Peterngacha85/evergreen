import api from './axios';

export const memberLogin   = (data) => api.post('/auth/member/login', data);
export const leaderLogin   = (data) => api.post('/auth/leader/login', data);
export const superAdminLogin = (data) => api.post('/auth/superadmin/login', data);

export const updateLeaderProfile = (data) => {
  const formData = new FormData();
  if (data.profilePhoto) formData.append('profilePhoto', data.profilePhoto);
  return api.put('/auth/leader/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateMemberPassword = (data) => api.put('/auth/member/password', data);
