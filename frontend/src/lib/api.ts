const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, try to refresh the token
  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
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
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
        } else {
          // Refresh failed, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } catch (err) {
        window.location.href = '/login';
      }
    } else {
       window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};
