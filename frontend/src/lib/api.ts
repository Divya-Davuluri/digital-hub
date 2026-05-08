const API_BASE = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://digital-hub-3h88.onrender.com';

export const getToken = (): string => {
  if (typeof window === 'undefined') 
    return '';
  return (
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  );
};

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  
  // Ensure the endpoint has the /api prefix if it's a relative path
  let path = endpoint;
  if (!path.startsWith('/api') && !path.startsWith('http')) {
    path = `/api${path.startsWith('/') ? '' : '/'}${path}`;
  }

  const url = path.startsWith('http') 
    ? path 
    : `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    return data;
  } catch {
    console.error(
      'Non-JSON from', endpoint, 
      ':', text.substring(0, 100)
    );
    throw new Error(
      `API error ${response.status}: Server returned non-JSON response`
    );
  }
};

export const apiFetch = apiCall;
export default apiCall;
