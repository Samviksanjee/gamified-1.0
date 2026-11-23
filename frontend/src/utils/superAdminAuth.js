/**
 * Super Admin Authentication and Storage Utilities
 * Provides functions for managing Super Admin JWT tokens and admin data
 */

const STORAGE_KEYS = {
  TOKEN: 'superadmin_token',
  ADMIN_DATA: 'superadmin_data',
};

/**
 * Get JWT token from localStorage
 * @returns {string|null} The stored JWT token or null if not found
 */
export function getSuperAdminToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error retrieving Super Admin token:', error);
    return null;
  }
}

/**
 * Store JWT token in localStorage
 * @param {string} token - The JWT token to store
 * @returns {boolean} True if successful, false otherwise
 */
export function setSuperAdminToken(token) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      return true;
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      return true;
    }
  } catch (error) {
    console.error('Error storing Super Admin token:', error);
    return false;
  }
}

/**
 * Clear token on logout
 * @returns {boolean} True if successful, false otherwise
 */
export function clearSuperAdminToken() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    return true;
  } catch (error) {
    console.error('Error clearing Super Admin token:', error);
    return false;
  }
}

/**
 * Check if Super Admin is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isSuperAdminAuthenticated() {
  try {
    const token = getSuperAdminToken();
    return Boolean(token && token.trim().length > 0);
  } catch (error) {
    console.error('Error checking Super Admin authentication status:', error);
    return false;
  }
}

/**
 * Get stored Super Admin data from localStorage
 * @returns {Object|null} The stored admin data object or null if not found
 */
export function getSuperAdminFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving Super Admin data from storage:', error);
    return null;
  }
}

/**
 * Store Super Admin data in localStorage
 * @param {Object} adminData - The admin data object to store
 * @returns {boolean} True if successful, false otherwise
 */
export function setSuperAdminToStorage(adminData) {
  try {
    if (adminData && typeof adminData === 'object') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(adminData));
      return true;
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
      return true;
    }
  } catch (error) {
    console.error('Error storing Super Admin data:', error);
    return false;
  }
}

/**
 * Validate if user has Super Admin role
 * @param {Object} user - The user object to validate
 * @returns {boolean} True if user.role === 'super_admin', false otherwise
 */
export function validateSuperAdminRole(user) {
  try {
    return user && user.role === 'super_admin';
  } catch (error) {
    console.error('Error validating Super Admin role:', error);
    return false;
  }
}

/**
 * Clear all Super Admin data on logout
 * Clears both token and admin data
 * @returns {boolean} True if both clear operations succeed
 */
export function clearAllSuperAdminData() {
  try {
    const tokenCleared = clearSuperAdminToken();
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    return tokenCleared;
  } catch (error) {
    console.error('Error clearing all Super Admin data:', error);
    return false;
  }
}
