const API_BASE = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://digital-hub-3h88.onrender.com';

export const getToken = (): string => {
  if (typeof window === 'undefined') 
    return '';
  return localStorage.getItem('token') ||
    sessionStorage.getItem('token') || '';
};

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
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
  
  try {
    return JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', 
      text.substring(0, 200));
    throw new Error(
      'Server returned invalid response. ' +
      'Status: ' + response.status
    );
  }
};

// Also keep apiFetch as an alias to avoid breaking other pages immediately
export const apiFetch = apiCall;

export default apiCall;
