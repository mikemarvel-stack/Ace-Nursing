/**
 * Debounce utility function
 * Delays function execution until after specified wait time has passed
 * Useful for frequently called functions like search or resize handlers
 * @param {Function} func - The function to debounce
 * @param {number} wait - Milliseconds to wait before calling the function
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Call on leading edge (default: false)
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, options = {}) => {
  let timeout;
  const leading = options.leading || false;
  const trailing = options.trailing !== false; // default true

  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (trailing) {
        func(...args);
      }
    };

    const callNow = leading && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };
};

/**
 * Throttle utility function
 * Ensures a function is called at most once every specified time period
 * @param {Function} func - The function to throttle
 * @param {number} limit - Milliseconds between calls
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
