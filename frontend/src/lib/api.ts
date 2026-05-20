const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  if (typeof window === 'undefined') {
    return 'https://digital-hub-og1a.onrender.com/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

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
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `API error ${response.status}: ` +
      'Invalid response from server'
    );
  }

  if (data && data.success === false) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

export const apiFetch = apiCall;
export default apiCall;
