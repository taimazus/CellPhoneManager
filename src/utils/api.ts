export async function safeFetchJson(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('cpm_auth_token') : null;
    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (!res.ok) {
        return { success: false, error: `خطای سرور (${res.status}): ${text.substring(0, 100)}` };
      }
      return { success: true, message: text };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در برقراری ارتباط با سرور' };
  }
}
