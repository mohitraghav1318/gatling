import { APP_STORAGE_KEYS } from '../config/env';

export function getAuthToken() {
  return localStorage.getItem(APP_STORAGE_KEYS.authToken) || '';
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

export function clearAuthToken() {
  localStorage.removeItem(APP_STORAGE_KEYS.authToken);
}
