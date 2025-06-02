/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,  
  transpilePackages: ['antd','@ant-design/icons'],
  async rewrites() {
    const apiUrl = 'http://localhost:5085'

    // 如果NEXT_PUBLIC_API_URL环境变量有值则使用
    if (process.env?.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
        },
      ];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;