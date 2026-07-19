---
title: "From Zero to AI Docs: A Complete Walkthrough"
description: "The complete end-to-end tutorial to set up, customize, build, and deploy an AI-powered documentation site."
---

# From Zero to AI Docs: A Walkthrough

This tutorial takes you from an empty directory to a fully deployed, AI-powered VitePress documentation portal. We will set up the site, add content, configure the DepthIndex plugin, and deploy it to Vercel.

## Step 1: Create the Project

Initialize a new folder and install VitePress:

```bash
mkdir my-ai-docs && cd my-ai-docs
npm init -y
npm install vitepress-plugin-depthindex --save-dev
npx vitepress init
```

During the VitePress init questionnaire, select your preferred options (theme, title, etc.).

## Step 2: Configure DepthIndex

Create or modify `.vitepress/config.ts` to import and register DepthIndex in the Vite plugins array:

```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'Enterprise AI Docs',
  description: 'AI-assisted developer documentation portal',
  
  vite: {
    plugins: [
      DepthIndex({
        mode: 'hybrid', // Combines offline-first fast search with cloud AI details
        personalization: {
          enabled: false // Ensures privacy-by-default
        }
      })
    ]
  }
});
```

## Step 3: Write Markdown Pages

Create a file named `guide/index.md` and paste some code snippets:

```markdown
# Developer Guide

Welcome to the Developer Guide. This guide helps you configure the gateway middleware.

## Configuration

To register the gateway, use the following code:

```javascript
const gateway = require('gateway-sdk');
gateway.init({
  apiKey: process.env.API_KEY
});
```
```

## Step 4: Build and Verify

Build the project locally:

```bash
npm run docs:build
```

You will see the crawler output:
```
[depthindex] Generating documentation index...
[depthindex] Index written successfully to assets/depth-index.json
[depthindex] Service worker emitted successfully.
```

## Step 5: Deploy to Vercel

To deploy your new site, link it to Vercel. 

Create a `vercel.json` file in the root to ensure proper caching:

```json
{
  "version": 2,
  "cleanUrls": true
}
```

Push your code to GitHub, connect the repository in the Vercel Dashboard, and deploy. Vercel will automatically compile the site and serve your new AI search engine instantly!
