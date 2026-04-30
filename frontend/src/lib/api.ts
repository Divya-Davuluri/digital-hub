const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' 
  ? 'https://digital-hub.onrender.com' 
  : 'http://localhost:5000');

/**
 * Enhanced Fetch Wrapper for Digital Marketing Hub
 * Handles: Authentication, Automatic Token Refresh, Global Error Handling, and Debugging Logs.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const base = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
  let fullUrl = `${base}${endpoint}`;
  
  // Local Dev Fallback: Pass tenant query param to backend
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const urlParams = new URLSearchParams(window.location.search);
    const tenant = urlParams.get('tenant');
    if (tenant) {
      const joiner = fullUrl.includes('?') ? '&' : '?';
      fullUrl += `${joiner}tenant=${tenant}`;
    }
  }
  
  // Critical Debug: Reveal which backend we are calling
  if (process.env.NODE_ENV === 'production') {
    console.log(`[PRODUCTION API] Targeting: ${fullUrl}`);
  } else {
    console.log(`[API REQUEST] ${options.method || 'GET'} ${fullUrl}`);
  }

  try {
    let response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle 401 Unauthorized (Token Expired)
    if (response.status === 401 && typeof window !== 'undefined' && endpoint !== '/auth/refresh') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        console.warn('[API] Access token expired, attempting refresh...');
        try {
          const refreshRes = await fetch(`${base}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const newTokens = await refreshRes.json();
            localStorage.setItem('token', newTokens.token);
            localStorage.setItem('refreshToken', newTokens.refreshToken);
            
            // Retry the original request with the new token
            const retryHeaders = {
              ...headers,
              'Authorization': `Bearer ${newTokens.token}`,
            };
            
            console.log(`[API RETRY] Retrying ${endpoint} with new token`);
            response = await fetch(fullUrl, {
              ...options,
              headers: retryHeaders,
              credentials: 'include',
            });
          } else {
            throw new Error('Refresh failed');
          }
        } catch (err) {
          console.error('[API AUTH] Session expired. Redirecting to login.');
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Server responded with an error' }));
      console.error(`[API ERROR] ${response.status} ${endpoint}:`, errorData);
      throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
  } catch (error: any) {
    console.error(`[FETCH FATAL] ${endpoint}:`, error.message);
    throw error;
  }
};
