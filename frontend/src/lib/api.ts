const API_BASE = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://digital-hub-3h88.onrender.com';

export const getToken = (): string => {
  if (typeof window === 'undefined') 
    return '';
  return localStorage.getItem('token') ||
    sessionStorage.getItem('token') || '';
};

/**
 * Enhanced API Call helper with proper error handling
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  
  // Ensure endpoint starts with /
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ensure all calls go to /api/... if not already present
  if (!path.startsWith('/api/') && path !== '/api') {
    path = `/api${path}`;
  }
  
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    }
  );
  
  const text = await response.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', text.substring(0, 200));
    throw new Error(`Server error (${response.status}). Please try again later.`);
  }

  // Handle non-200 responses
  if (!response.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  
  return data;
};

export const apiFetch = apiCall;
export default apiCall;
