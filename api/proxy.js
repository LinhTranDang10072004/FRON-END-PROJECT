export default async function handler(req, res) {
  const apiUrl = 'http://103.56.162.223/api' + req.url.replace('/api/proxy', '');
  
  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: '103.56.162.223'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
