/**
 * Super Admin Dashboard Helper Utilities
 * Provides utility functions for formatting, validation, and common operations
 */

/**
 * Format ISO date string to readable date format
 * @param {string} dateString - ISO format date string (e.g., "2024-01-15T10:30:00Z")
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 * @throws {Error} If date string is invalid
 */
export const formatDate = (dateString) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format ISO date string to readable date and time format
 * @param {string} dateString - ISO format date string (e.g., "2024-01-15T10:30:00Z")
 * @returns {string} Formatted date and time (e.g., "Jan 15, 2024, 10:30 AM")
 * @throws {Error} If date string is invalid
 */
export const formatDateTime = (dateString) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return '';
  }
};

/**
 * Get color code for status badge
 * @param {string} status - Status value (pending, used, revoked, expired, active, inactive, success, failure)
 * @returns {object} Color object with background and text color codes
 */
export const getStatusColor = (status) => {
  const statusMap = {
    pending: { bg: '#FFF3CD', text: '#856404', label: 'Pending' },
    used: { bg: '#D4EDDA', text: '#155724', label: 'Used' },
    revoked: { bg: '#F8D7DA', text: '#721C24', label: 'Revoked' },
    expired: { bg: '#E2E3E5', text: '#383D41', label: 'Expired' },
    active: { bg: '#D4EDDA', text: '#155724', label: 'Active' },
    inactive: { bg: '#E2E3E5', text: '#383D41', label: 'Inactive' },
    success: { bg: '#D4EDDA', text: '#155724', label: 'Success' },
    failure: { bg: '#F8D7DA', text: '#721C24', label: 'Failure' },
  };

  return statusMap[status?.toLowerCase()] || {
    bg: '#E2E3E5',
    text: '#383D41',
    label: 'Unknown',
  };
};

/**
 * Debounce function to limit function calls during rapid events
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
export const debounce = (func, delay) => {
  if (typeof func !== 'function') {
    throw new Error('First argument must be a function');
  }
  if (typeof delay !== 'number' || delay < 0) {
    throw new Error('Delay must be a non-negative number');
  }

  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Get initials from a name for avatar display
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (name) => {
  try {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
    );
  } catch (error) {
    console.error('Error getting initials:', error);
    return '';
  }
};

/**
 * Truncate long email addresses for display
 * @param {string} email - Email address to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated email
 */
export const truncateEmail = (email, length = 20) => {
  try {
    if (!email || typeof email !== 'string') return '';
    if (email.length <= length) return email;
    return email.substring(0, length - 3) + '...';
  } catch (error) {
    console.error('Error truncating email:', error);
    return email || '';
  }
};

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 * @param {string} password - Password to validate
 * @returns {object} Object with isValid boolean and requirements details
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  return {
    isValid: Object.values(requirements).every((req) => req === true),
    requirements,
  };
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<object>} Promise resolving to object with success flag and message
 */
export const copyToClipboard = async (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return {
        success: false,
        message: 'Invalid text provided',
      };
    }

    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        message: 'Copied to clipboard',
      };
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return {
        success,
        message: success ? 'Copied to clipboard' : 'Failed to copy',
      };
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
};

/**
 * Format large numbers with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "1,234,567")
 */
export const formatNumber = (num) => {
  try {
    if (typeof num !== 'number' && typeof num !== 'string') return '';
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US');
  } catch (error) {
    console.error('Error formatting number:', error);
    return '';
  }
};
