import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const API_BASE_URL = 'http://103.56.162.223:7088/api';
    
    // Lấy path từ URL
    const urlPath = req.url?.replace('/api/proxy', '') || '';
    const targetUrl = `${API_BASE_URL}${urlPath}`;
    
    console.log('Proxying to:', targetUrl);
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader) {
      headers['Authorization'] = authHeader as string;
    }
    
    // Build fetch options
    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers: headers,
    };
    
    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response body
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return res.status(response.status).json(data);
    
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy error',
      message: error.message,
      details: error.toString()
    });
  }
}
