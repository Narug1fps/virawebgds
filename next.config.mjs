/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/reset-password/:path*',
        destination: '/reset-password',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
