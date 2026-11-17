// CORS工具函数，用于为OrionTV客户端提供跨域支持
export function createCorsHeaders(): Headers {
  const headers = new Headers();
  
  // 设置CORS头部，允许OrionTV客户端跨域访问
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400'); // 24小时
  
  return headers;
}

// 为NextResponse添加CORS头部
export function addCorsHeaders(response: Response): Response {
  const corsHeaders = createCorsHeaders();
  
  // 将CORS头部添加到现有响应头部中
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// 处理OPTIONS预检请求
export function handleOptionsRequest(): Response {
  return new Response(null, {
    status: 200,
    headers: createCorsHeaders(),
  });
}
