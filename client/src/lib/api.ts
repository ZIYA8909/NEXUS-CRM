const BASE_URL = '';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customOptions } = options;

  let queryUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      queryUrl = `${url}?${queryString}`;
    }
  }

  const token = localStorage.getItem('token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(queryUrl, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customOptions,
  });

  // Handle file downloads (CSV/Excel report exports)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename = 'report.csv';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return {} as T;
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected network error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // JSON parsing failed, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // If there's no content, return empty
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>, options?: RequestOptions) => 
    request<T>(url, { method: 'GET', params, ...options }),
    
  post: <T>(url: string, body?: any, options?: RequestOptions) => 
    request<T>(url, { method: 'POST', body: JSON.stringify(body), ...options }),
    
  put: <T>(url: string, body?: any, options?: RequestOptions) => 
    request<T>(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
    
  patch: <T>(url: string, body?: any, options?: RequestOptions) => 
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body), ...options }),
    
  del: <T>(url: string, options?: RequestOptions) => 
    request<T>(url, { method: 'DELETE', ...options }),
};
