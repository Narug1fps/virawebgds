import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://(coloque-aqui)'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '/',
    '/sobre',
    '/precos',
    '/contato',
    '/gestor-de-clientes',
    '/gestor-de-consultorio',
    '/gestor-de-clinica',
    '/gestor-de-empresa',
    '/pricing',
    '/login',
    '/signup',
  ]

  return routes.map((route) => ({
    url: `${SITE_URL.replace(/\/$/, '')}${route}`,
    lastModified: new Date().toISOString(),
  }))
}
