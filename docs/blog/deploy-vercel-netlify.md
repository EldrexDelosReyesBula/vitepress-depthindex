---
title: "Deploying DepthIndex Docs on Vercel and Netlify"
description: "Step-by-step instructions to configure environment variables and deployment scripts for modern hosting platforms."
---

# Deploying DepthIndex Docs on Vercel and Netlify

Once you have configured DepthIndex on your documentation site, you are ready to deploy it to a hosting platform. In this guide, we walk through configuring environment variables and build pipelines for Vercel and Netlify.

## Deploying on Vercel

Vercel detects VitePress automatically. To ensure DepthIndex compiles correctly, configure your project settings:

1. **Build Command**: `npm run docs:build` (or `pnpm run docs:build`)
2. **Output Directory**: `.vitepress/dist`
3. **Environment Variables**: If you are using Hybrid mode, add your API keys:
   * `DEPTHINDEX_CLOUD_API_KEY`: Your Google Gemini or OpenAI API key.

## Deploying on Netlify

For Netlify deployments, create a `netlify.toml` configuration file in your project root to handle Brotli file compression:

```toml
[build]
  command = "npm run docs:build"
  publish = "docs/.vitepress/dist"

[[headers]]
  for = "*.br"
  [headers.values]
    Content-Encoding = "br"
    Content-Type = "application/json"
```

Push your changes to your repository, link the project to Netlify, and trigger a build. Your site will deploy with fully functional offline AI search.
