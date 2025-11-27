# SEO Checklist — Next.js (App Router) + TypeScript

1. Metadata
- Configure `title`, `description`, `keywords` in `app/layout.tsx` or per-page `generateMetadata`.
- Set `openGraph` and `twitter` metadata (images + alt text).

2. Technical
- Add `app/sitemap.ts` (done) and verify `/sitemap.xml`.
- Add `app/robots.ts` (done) pointing to sitemap.
- Add `manifest.json` and icons in `public/` (done).

3. Schema.org
- Add `Organization` and `WebSite` JSON-LD (in `app/layout.tsx`), and page-level `FAQ` JSON-LD where applicable (use `components/seo.tsx`).

4. Performance (Core Web Vitals)
- Preload critical fonts, avoid render-blocking scripts.
- Use Next/Image or optimized static images with proper sizes.
- Avoid layout-shifting elements without size attributes (reserve space for images/iframes).

5. Content
- Use unique `title` and `meta description` per page.
- Add `og:image` (1200x630) and `twitter:image`.

6. Tools
- Connect site to Google Search Console and submit sitemap.
- Add Lighthouse, PageSpeed, Web Vitals monitoring (Vercel Analytics included).

Update placeholders in `.env.local`:
```
NEXT_PUBLIC_SITE_URL=https://seudominio.com
NEXT_PUBLIC_SITE_NAME=Nome Do Site
NEXT_PUBLIC_COMPANY_NAME=Nome da Empresa
NEXT_PUBLIC_SITE_LOGO=/logo.png
NEXT_PUBLIC_SOCIALS='["https://twitter.com/..","https://www.facebook.com/.."]'
NEXT_PUBLIC_THEME_COLOR=#0ea5a4
```
