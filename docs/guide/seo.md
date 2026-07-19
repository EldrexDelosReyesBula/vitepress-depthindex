---
title: SEO & Discoverability
description: Configure meta tags, robots policies, sitemaps, and llms.txt files for AI search spiders.
---

# SEO & Discoverability

## Auto-Generated Files
VitePress DepthIndex automatically optimizes your documentation site for search engines and AI web spiders. During the build phase, it compiles and injects structured SEO files in the output directory, ensuring your content is discoverable.

## sitemap.xml
DepthIndex generates a standard sitemap containing all crawled markdown page URLs. The sitemap includes priority fields and last-modified dates based on git commit logs, allowing search engines to index your pages efficiently.

## robots.txt
The build pipeline compiles a standard `robots.txt` that directs search engine spiders. You can customize rules or allow/deny specific crawlers using the `aiCrawlerPolicy` option.

### Standard Crawlers
Standard search engines (such as Googlebot, Bingbot, and Yandex) are allowed full access to crawl and index all documentation pages by default.

### AI Crawlers (GPTBot, Google-Extended, Claude-Web)
Manage access for modern AI agents and LLM scraping spiders:
- **`allow`**: Permits AI crawlers to scrape documentation text to feed training datasets.
- **`disallow`**: Explicitly blocks AI scrapers (like `GPTBot`, `ChatGPT-User`, `Google-Extended`, `Claude-Web`, and `ClaudeBot`) inside `robots.txt`.
- **`selective`**: Permits crawlers to read summary documents but blocks scraping of raw content.

## llms.txt & llms.jsonl
At build time, DepthIndex generates standardized text summaries for AI systems:
- **`llms.txt`**: A markdown file containing structured summaries of your entire documentation, making it easy for AI models to understand your project.
- **`llms-full.txt`**: A consolidated document containing the full text of all pages.
- **`llms.jsonl`**: Standardized JSON Lines files containing structured page chunks, code snippets, and metadata.

## .well-known/ai.json
DepthIndex emits an AI discoverability descriptor file at `/.well-known/ai.json`. This endpoint describes your site name, schema structure, and available API options, helping AI agents navigate your documentation portal.

## Meta Tags
For every page, the build plugin injects semantic meta tags in the `<head>` of static HTML files, including keyword lists, canonical tags, and last-modified dates.

## Open Graph
Generates standard Open Graph tags (`og:title`, `og:description`, `og:image`, `og:site_name`) for social previews on platforms like Discord, Slack, and Facebook.

## Twitter Cards
Injects Twitter Card metadata tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) to optimize page links shared on X (formerly Twitter).

## Schema.org Structured Data
DepthIndex generates and embeds JSON-LD structured data on all pages. It classifies your site as a `TechArticle` or `APIReference` based on heading counts, making it eligible for Google rich results.

## Google Search Console
Verify ownership and submit your auto-generated sitemap easily by configuring your verification token:
```typescript
seo: {
  siteName: 'DepthIndex Docs',
  siteDescription: 'On-device intelligence layer.',
  googleSiteVerification: 'your_google_verification_token'
}
```

## Free Domain Optimization
Documentation hosted on free subdomains (such as `*.github.io`, `*.vercel.app`, or `*.netlify.app`) often faces search indexing challenges. DepthIndex includes a **Free Domain Optimizer** that:
- Injects search submission signals and crawler hints in the HTML header.
- Appends automated structured search hints near the footer.
- Boosts domain authority rankings by structuring local cross-links cleanly.
