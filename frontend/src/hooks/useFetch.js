import { useEffect, useState } from 'react';
import { api } from '../api';

/**
 * Hook for fetching data with automatic cleanup on unmount
 * Handles AbortController signals to prevent memory leaks
 * @param {Function} apiCall - Async function that makes the API call
 * @param {Array} deps - Dependencies for the effect
 * @param {Object} options - Additional options (onError callback, etc)
 */
export const useFetch = (apiCall, deps = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall({ signal: controller.signal });
        
        if (isMounted) {
          setData(result.data);
        }
      } catch (err) {
        // Don't set error if request was aborted
        if (err.name !== 'AbortError' && isMounted) {
          setError(err);
          if (options.onError) {
            options.onError(err);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, deps);

  return { data, loading, error };
};
