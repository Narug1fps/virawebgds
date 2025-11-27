import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://(coloque-aqui)'

export async function GET() {
  const content = `User-agent: *\nDisallow:\n\nSitemap: ${SITE_URL.replace(/\/$/, '')}/sitemap.xml\n`

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export const dynamic = 'force-dynamic'
