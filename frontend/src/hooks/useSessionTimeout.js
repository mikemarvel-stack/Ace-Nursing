import { useEffect } from 'react';
import { useAuthStore } from '../store';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL = 60 * 1000; // Check every minute

/**
 * Hook to implement session timeout with activity tracking
 * Logs out user if inactive for 30 minutes
 */
export const useSessionTimeout = () => {
  useEffect(() => {
    const { isAuthenticated, lastActivityTime, updateActivity, logout } = useAuthStore.getState();

    if (!isAuthenticated) return;

    // Track user activity events
    const handleActivity = () => {
      updateActivity();
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for session timeout periodically
    const timeoutCheck = setInterval(() => {
      const { isAuthenticated: isAuth, lastActivityTime: lastActivity } = useAuthStore.getState();

      if (!isAuth || !lastActivity) {
        clearInterval(timeoutCheck);
        return;
      }

      const inactivityDuration = Date.now() - lastActivity;
      if (inactivityDuration > SESSION_TIMEOUT) {
        logout();
        clearInterval(timeoutCheck);
      }
    }, CHECK_INTERVAL);

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(timeoutCheck);
    };
  }, []);
};
