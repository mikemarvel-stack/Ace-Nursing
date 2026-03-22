import { useEffect, useRef } from 'react';

/**
 * Safe async effect hook that handles:
 * - Automatic cleanup on component unmount
 * - Request cancellation via AbortController
 * - Prevents state updates on unmounted components
 * - Proper error handling
 * 
 * @param {Function} asyncFn - Async function that accepts { signal } in options
 * @param {Array} deps - Dependency array
 * @param {Object} options - Options { onError, timeout }
 * 
 * @example
 * useSafeAsyncEffect(
 *   async ({ signal }) => {
 *     const data = await fetch('/api/data', { signal });
 *     return data;
 *   },
 *   [],
 *   { onError: (err) => console.error(err) }
 * );
 */
export const useSafeAsyncEffect = (asyncFn, deps = [], options = {}) => {
  const { onError, timeout = 0 } = options;
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    const executeAsync = async () => {
      try {
        if (!isMountedRef.current) return;

        // Set optional timeout
        if (timeout > 0) {
          timeoutIdRef.current = setTimeout(() => {
            abortControllerRef.current?.abort();
          }, timeout);
        }

        await asyncFn({ signal: abortControllerRef.current.signal });
      } catch (err) {
        // Ignore abort errors (expected on cleanup)
        if (err.name === 'AbortError') {
          return;
        }

        // Only call error handler if component is still mounted
        if (isMountedRef.current && onError) {
          onError(err);
        } else if (err.name !== 'AbortError') {
          console.error('Error in useSafeAsyncEffect:', err);
        }
      }
    };

    executeAsync();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Cancel ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear timeout if set
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, deps);
};

export default useSafeAsyncEffect;
