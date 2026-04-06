const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

// Keep API base URL in one place so changing environments is easy later.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export const APP_STORAGE_KEYS = {
  authToken: 'mails_system_auth_token',
};
