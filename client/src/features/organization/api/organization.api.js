import axios from 'axios';
import { API_BASE_URL } from '../../../shared/config/env';
import { getAuthToken } from '../../../shared/utils/authSession';

const organizationHttp = axios.create({
  baseURL: `${API_BASE_URL}/org`,
  timeout: 15000,
});

organizationHttp.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrapResponse(response) {
  return response.data;
}

export const organizationApi = {
  listMembers: (organizationName) =>
    organizationHttp.get(`/${organizationName}/members`).then(unwrapResponse),

  addMember: (organizationName, payload) =>
    organizationHttp
      .post(`/${organizationName}/members`, payload)
      .then(unwrapResponse),

  updateMemberRole: (organizationName, membershipId, payload) =>
    organizationHttp
      .patch(`/${organizationName}/members/${membershipId}/role`, payload)
      .then(unwrapResponse),

  removeMember: (organizationName, membershipId) =>
    organizationHttp
      .delete(`/${organizationName}/members/${membershipId}`)
      .then(unwrapResponse),

  getMailConfigMeta: (organizationName) =>
    organizationHttp
      .get(`/${organizationName}/mail-config`)
      .then(unwrapResponse),

  upsertMailConfig: (organizationName, payload) =>
    organizationHttp
      .put(`/${organizationName}/mail-config`, payload)
      .then(unwrapResponse),
};
