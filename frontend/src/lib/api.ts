const API_BASE = 
  (process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-3h88.onrender.com') + '/api';

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
  
  let targetPath = endpoint;
  if (!endpoint.startsWith('http')) {
    // Ensure leading slash
    if (!endpoint.startsWith('/')) {
      targetPath = '/' + endpoint;
    }
    // Avoid double /api if endpoint already includes it
    if (targetPath.startsWith('/api')) {
      targetPath = targetPath.substring(4);
    }
    targetPath = `${API_BASE}${targetPath}`;
  }
  
  const url = targetPath;

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
    return JSON.parse(text);
  } catch {
    throw new Error(
      `API error ${response.status}: ` +
      'Invalid response from server'
    );
  }
};

export const apiFetch = apiCall;
export default apiCall;
