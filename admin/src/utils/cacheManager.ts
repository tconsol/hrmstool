/**
 * Cache Manager Utility - PRODUCTION GRADE
 * Handles clearing localStorage, sessionStorage, and Service Worker caches
 * 
 * Features:
 * - Version-based cache busting for new deployments
 * - Selective cache clearing (auth vs all)
 * - Service Worker cache cleanup
 * - IndexedDB cleanup
 */

export const CACHE_VERSION = import.meta.env.VITE_APP_VERSION || 'v1';
export const CACHE_PREFIX = 'hrms';

/**
 * Clear all caches (localStorage, sessionStorage, IndexedDB, and Service Worker caches)
 * Used on logout or security events
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    // 1. Clear localStorage (except theme/lang preferences)
    const keysToKeep = ['theme', 'language', 'hrms_cache_version'];
    const keysToRemove = Object.keys(localStorage).filter(
      (key) => !keysToKeep.includes(key)
    );
    keysToRemove.forEach((key) => localStorage.removeItem(key));    // 2. Clear sessionStorage
    sessionStorage.clear();    // 3. Clear Service Worker caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);        }
      } catch (cacheError) {      }
    }

    // 4. Clear IndexedDB if available
    if (window.indexedDB) {
      try {
        const dbs = await (window.indexedDB as any).databases?.() || [];
        for (const db of dbs) {
          window.indexedDB.deleteDatabase(db.name);        }
      } catch (dbError) {      }
    }  } catch (error) {  }
};

/**
 * Clear only auth-related data but keep other preferences
 * Used on logout, session timeout, or 401 errors
 */
export const clearAuthCache = async (): Promise<void> => {
  try {
    // Remove auth data from localStorage
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    
    // Clear sessionStorage
    sessionStorage.clear();

    // Clear API responses from Service Worker caches (but keep static assets)
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          // Remove API-related cache entries only
          for (const request of requests) {
            if (request.url.includes('/api/') || request.url.includes('Bearer')) {
              await cache.delete(request);
            }
          }
        }
      } catch (cacheError) {      }
    }  } catch (error) {  }
};

/**
 * Cache busting for new deployments
 * Compares stored version with current build version
 */
export const shouldBustCache = (): boolean => {
  const storedVersion = localStorage.getItem(`${CACHE_PREFIX}_cache_version`);
  
  if (storedVersion !== CACHE_VERSION) {    localStorage.setItem(`${CACHE_PREFIX}_cache_version`, CACHE_VERSION);
    return true;
  }
  
  return false;
};

/**
 * Force cache bust on new deployment
 * Clears API responses only, keeps static assets
 */
export const bustCache = async (): Promise<void> => {  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          if (request.url.includes('/api/')) {
            await cache.delete(request);          }
        }
      }
    }
    
    localStorage.setItem(`${CACHE_PREFIX}_cache_version`, CACHE_VERSION);  } catch (error) {  }
};

/**
 * Debounced activity handler to avoid excessive timer resets
 */
export const createDebouncedActivityHandler = (callback: () => void, debounceMs: number = 1000) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, debounceMs);
  };
};
