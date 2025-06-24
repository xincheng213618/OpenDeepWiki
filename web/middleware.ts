import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 只处理 /api 路径的请求
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5085'
    
    // 构建目标 URL
    const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, apiUrl)
    
    // 创建新的请求头，包含原始请求的所有头部
    const requestHeaders = new Headers(request.headers)
    
    // 确保 cookie 被转发
    const cookies = request.cookies.toString()
    if (cookies) {
      requestHeaders.set('Cookie', cookies)
    }
    
    // 添加其他可能需要的头部
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    requestHeaders.set('X-Forwarded-For', clientIP)
    requestHeaders.set('X-Forwarded-Host', request.headers.get('host') || 'unknown')
    requestHeaders.set('X-Forwarded-Proto', request.nextUrl.protocol.replace(':', ''))
    
    // 如果是 POST/PUT/PATCH 等请求，需要处理请求体
    const init: RequestInit = {
      method: request.method,
      headers: requestHeaders,
    }
    
    // 对于有请求体的方法，添加请求体
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      init.body = request.body
    }
    
    // 发送请求到后端API并返回响应
    return fetch(targetUrl.toString(), init)
      .then(async (response) => {
        // 创建响应头对象
        const responseHeaders = new Headers()
        
        // 复制响应头，包括 Set-Cookie
        response.headers.forEach((value, key) => {
          responseHeaders.set(key, value)
        })
        
        // 获取响应体
        const responseBody = await response.arrayBuffer()
        
        return new NextResponse(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        })
      })
      .catch((error) => {
        console.error('API 代理错误:', error)
        return new NextResponse(
          JSON.stringify({ error: '代理请求失败' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      })
  }
  
  // 对于非 API 路径，直接继续
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 匹配所有 API 路径
    '/api/:path*',
  ],
} 