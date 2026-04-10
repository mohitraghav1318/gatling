import axios from 'axios';
import { API_BASE_URL } from '../../../shared/config/env';
import { getAuthToken } from '../../../shared/utils/authSession';

const dashboardHttp = axios.create({
  baseURL: `${API_BASE_URL}/dashboard`,
  timeout: 12000,
});

const organizationHttp = axios.create({
  baseURL: `${API_BASE_URL}/org`,
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

function withAuthConfig() {
  return { headers: withAuthHeader() };
}

// Centralized dashboard calls keep page components simple and focused on UI state.
export const dashboardApi = {
  getOverview: () =>
    dashboardHttp.get('/', withAuthConfig()).then(unwrapResponse),

  getMyActivity: () =>
    dashboardHttp.get('/activity', withAuthConfig()).then(unwrapResponse),

  updateProfile: (payload) =>
    dashboardHttp
      .patch('/profile', payload, withAuthConfig())
      .then(unwrapResponse),

  updateUsername: (payload) =>
    dashboardHttp
      .patch('/profile/username', payload, withAuthConfig())
      .then(unwrapResponse),

  createOrganization: (payload) =>
    organizationHttp.post('/', payload, withAuthConfig()).then(unwrapResponse),

  joinOrganization: (payload) =>
    organizationHttp
      .post('/join', payload, withAuthConfig())
      .then(unwrapResponse),

  getOrganizationByName: (organizationName) =>
    organizationHttp
      .get(`/${encodeURIComponent(organizationName)}`, withAuthConfig())
      .then(unwrapResponse),

  getUserByUsername: (username) =>
    dashboardHttp
      .get(`/u/${encodeURIComponent(username)}`, withAuthConfig())
      .then(unwrapResponse),
};
