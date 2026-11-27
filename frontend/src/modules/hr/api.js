// src/modules/hr/api.js
// Delegates to the unified frontend API client.
export {
  apiClient as api,
  apiClient,
  apiRequest,
  API_BASE,
  TOKEN_STORAGE_KEY,
  getStoredToken,
  setStoredToken,
} from '../../api/index.js';
