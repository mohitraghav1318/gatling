import axios from 'axios';
import { API_BASE_URL } from '../../../shared/config/env';
import { getAuthToken } from '../../../shared/utils/authSession';

const dashboardHttp = axios.create({
  baseURL: `${API_BASE_URL}/dashboard`,
  timeout: 12000,
});

function withAuthHeader() {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
  };
}

function unwrapResponse(response) {
  return response.data;
}

// Centralized dashboard calls keep page components simple and focused on UI state.
export const dashboardApi = {
  getOverview: () =>
    dashboardHttp.get('/', { headers: withAuthHeader() }).then(unwrapResponse),

  getMyActivity: () =>
    dashboardHttp
      .get('/activity', { headers: withAuthHeader() })
      .then(unwrapResponse),

  updateProfile: (payload) =>
    dashboardHttp
      .patch('/profile', payload, { headers: withAuthHeader() })
      .then(unwrapResponse),

  updateUsername: (payload) =>
    dashboardHttp
      .patch('/profile/username', payload, { headers: withAuthHeader() })
      .then(unwrapResponse),

  createOrganization: (payload) =>
    dashboardHttp
      .post('/org', payload, { headers: withAuthHeader() })
      .then(unwrapResponse),

  joinOrganization: (payload) =>
    dashboardHttp
      .post('/org/join', payload, { headers: withAuthHeader() })
      .then(unwrapResponse),

  getOrganizationByName: (organizationName) =>
    dashboardHttp
      .get(`/org/${encodeURIComponent(organizationName)}`, {
        headers: withAuthHeader(),
      })
      .then(unwrapResponse),

  getUserByUsername: (username) =>
    dashboardHttp
      .get(`/u/${encodeURIComponent(username)}`, {
        headers: withAuthHeader(),
      })
      .then(unwrapResponse),
};
