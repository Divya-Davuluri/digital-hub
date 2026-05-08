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
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE}${endpoint}`;

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
      `API error ${response.status}: ` +
      'Server returned non-JSON response'
    );
  }
};

export default apiCall;
