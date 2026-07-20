# Deployment Guide

## Overview
Deploying a VitePress site integrated with DepthIndex is straightforward. This guide covers setup procedures for Vercel, Netlify, GitHub Pages, Cloudflare Pages, self-hosted environments, and HTTPS SSL requirements.

---

## Vercel

### One-Click Deploy
Link your GitHub repository to Vercel. It automatically detects the VitePress project structure.

### Manual Setup
- Framework Preset: `VitePress` (or `Other`)
- Build Command: `npm run docs:build`
- Output Directory: `docs/.vitepress/dist`

### Environment Variables
Add cloud API keys securely in project settings:
`DEPTHINDEX_GEMINI_API_KEY=your_api_key_here`

### Custom Domain
Set CNAME or A records under Domains settings in Vercel Dashboard.

---

## Netlify

### Setup Steps
1. Create a site from GitHub.
2. Build settings:
   - Build command: `npm run docs:build`
   - Publish directory: `docs/.vitepress/dist`

### Environment Variables
Define variables in Site settings → Environment variables.

### Custom Domain
Configure your DNS nameservers to point to Netlify's DNS system.

---

## GitHub Pages

### Setup Steps
Configure GitHub Pages to build using GitHub Actions or deploy from a branch (e.g. `gh-pages`).

### Base Path Configuration
If hosting at `username.github.io/repo/`, configure the `base` path in `config.ts`:
```typescript
export default defineConfig({
  base: '/repo/'
})
```

### GitHub Actions
Use the official VitePress deployment template:
```yaml
# .github/workflows/deploy.yml
name: Deploy site
on:
  push:
    branches: [main]
```

---

## Cloudflare Pages

### Setup Steps
1. Connect GitHub/GitLab repository.
2. Setup build configurations:
   - Framework preset: `VitePress`
   - Build command: `npm run docs:build`
   - Output directory: `docs/.vitepress/dist`

### Environment Variables
Set environmental credentials under Cloudflare dashboard variable section.

---

## Self-Hosted

### Nginx Configuration
Ensure proper fallback handling and JSON header options:
```nginx
server {
    listen 80;
    server_name docs.example.com;
    root /var/www/docs/.vitepress/dist;

    location / {
        try_files $uri $uri.html $uri/ /404.html;
    }
}
```

### Apache Configuration
Configure `.htaccess` for clean URLs:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^([^/]+)$ $1.html [L]
```

### Docker Setup
Use Nginx alpine image:
```dockerfile
FROM nginx:alpine
COPY docs/.vitepress/dist /usr/share/nginx/html
```

### Node.js Server
Deploy Nginx static proxy or serve statically via Express:
```javascript
app.use(express.static('docs/.vitepress/dist'));
```

---

## HTTPS Requirements

### Why HTTPS is Required (PWA)
DepthIndex uses PWA Service Workers to cache data and run on-device vectors offline. Service workers require **HTTPS** protection (except for `localhost`) to maintain security standards.

### Free SSL Options
- Use Let's Encrypt with Certbot on VPS self-hosted systems.
- Vercel, Netlify, and Cloudflare Pages offer automated free SSL.

---

## Custom Domain Setup
Ensure A/AAAA and CNAME records are fully propagated before turning on SSL generation.

---

## SEO Verification

### Google Search Console
Add verification meta tags under config.ts head settings:
```typescript
head: [
  ['meta', { name: 'google-site-verification', content: '...' }]
]
```

### Bing Webmaster Tools
Provide the Bing XML verification file in the public assets directory.

### Yandex Webmaster
Include the Yandex verification HTML tag.

---

## Post-Deployment Checklist
- [ ] Verify SSL certificate is valid and active.
- [ ] Confirm Service Worker starts up successfully in browser console.
- [ ] Perform a test query in the search bar and verify offline index generation.
- [ ] Test the chat panel's fallback capabilities.

---

## Troubleshooting Deployments
- **404 on Refresh**: Ensure router redirects clean URLs correctly (Nginx `try_files` rule).
- **Index Loading Failures**: Verify output directory has `llms.txt` and PWA assets.
- **Service Worker unregistered**: Check HTTPS setup.
