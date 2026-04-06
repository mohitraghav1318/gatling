import axios from 'axios';
import { API_BASE_URL } from '../../../shared/config/env';

const authHttp = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  timeout: 12000,
});

function unwrapResponse(response) {
  return response.data;
}

// Keep endpoint paths centralized for easier maintenance.
const AUTH_ENDPOINTS = {
  signupStart: '/signup/start',
  signupVerifyOtp: '/signup/verify-otp',
  signupComplete: '/signup/complete',
  loginPassword: '/login/password',
  loginOtpRequest: '/login/otp/request',
  loginOtpVerify: '/login/otp/verify',
};

export const authApi = {
  startSignup: (payload) =>
    authHttp.post(AUTH_ENDPOINTS.signupStart, payload).then(unwrapResponse),

  verifySignupOtp: (payload) =>
    authHttp.post(AUTH_ENDPOINTS.signupVerifyOtp, payload).then(unwrapResponse),

  completeSignup: (payload) =>
    authHttp.post(AUTH_ENDPOINTS.signupComplete, payload).then(unwrapResponse),

  loginWithPassword: (payload) =>
    authHttp.post(AUTH_ENDPOINTS.loginPassword, payload).then(unwrapResponse),

  requestLoginOtp: (payload) =>
    authHttp.post(AUTH_ENDPOINTS.loginOtpRequest, payload).then(unwrapResponse),

  verifyLoginOtp: (payload) =>
    authHttp.post(AUTH_ENDPOINTS.loginOtpVerify, payload).then(unwrapResponse),
};
