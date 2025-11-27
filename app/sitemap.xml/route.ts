import { NextResponse } from 'next/server'

// NOTE: Atualize `SITE_URL` para o domínio de produção (ex.: https://seusite.com)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://viraweb.online'

const staticPages = ['/', '/pricing', '/login', '/signup', '/forgot-password']

function generateSiteMap() {
  const now = new Date().toISOString()

  const urls = staticPages
    .map((path) => {
      return `
    <url>
      <loc>${SITE_URL}${path}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`
}

export async function GET() {
  const sitemap = generateSiteMap()
  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
