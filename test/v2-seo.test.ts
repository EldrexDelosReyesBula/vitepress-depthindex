import { describe, it, expect } from 'vitest';
import { SEOOptimizer } from '../src/build/seo-optimizer.js';
import { MetaTagInjector } from '../src/build/meta-injector.js';
import { FreeDomainOptimizer } from '../src/build/free-domain-seo.js';
import { ExtractedPage } from '../src/types/index.js';

describe('VitePress DepthIndex SEO & Indexability Framework', () => {

  const mockPages: ExtractedPage[] = [
    {
      url: '/',
      title: 'Home Page',
      headings: [
        { level: 1, text: 'Welcome to DepthIndex', id: 'welcome' }
      ],
      sections: [
        {
          heading: 'Welcome to DepthIndex',
          content: 'This is the home page for DepthIndex. It is a powerful local indexing search assistant. ![Logo](/images/logo.png)',
          codeBlocks: [],
          mermaidDiagrams: [],
          links: []
        }
      ],
      frontmatter: {
        description: 'VitePress plugin for smart AI-powered documentation indexing and search',
        keywords: ['search', 'indexer', 'vitepress']
      },
      lastModified: Date.now()
    },
    {
      url: '/guide/quick-start',
      title: 'Quick Start',
      headings: [
        { level: 1, text: 'Quick Start Guide', id: 'quick-start' },
        { level: 2, text: '1. Installation', id: 'step-1' },
        { level: 2, text: '2. Setup Configuration', id: 'step-2' }
      ],
      sections: [
        {
          heading: 'Quick Start Guide',
          content: 'Follow these steps to configure your project. npm install vitepress-plugin-depthindex',
          codeBlocks: [
            { language: 'bash', code: 'npm install vitepress-plugin-depthindex' }
          ],
          mermaidDiagrams: [],
          links: []
        }
      ],
      frontmatter: {
        description: 'Get started with DepthIndex in minutes.'
      },
      lastModified: Date.now()
    }
  ];

  it('should generate valid sitemap.xml with custom page priorities and images', async () => {
    const optimizer = new SEOOptimizer({
      siteName: 'DepthIndex Docs',
      siteDescription: 'Search indexing library',
      siteUrl: 'https://depthindex.js.org',
    });

    const output = await optimizer.optimize(mockPages, 'dist');

    const sitemap = output.files['sitemap.xml'];
    expect(sitemap).toBeDefined();
    expect(sitemap).toContain('https://depthindex.js.org/');
    expect(sitemap).toContain('https://depthindex.js.org/guide/quick-start');
    expect(sitemap).toContain('<image:loc>https://depthindex.js.org/images/logo.png</image:loc>');
    expect(sitemap).toContain('<priority>1.0</priority>'); // Homepage
    expect(sitemap).toContain('<priority>0.9</priority>'); // Getting started / Quick start
  });

  it('should generate robots.txt with AI crawlers block/allow list', async () => {
    const optimizer = new SEOOptimizer({
      siteName: 'DepthIndex Docs',
      siteDescription: 'Search indexing library',
      siteUrl: 'https://depthindex.js.org',
      aiCrawlerPolicy: 'selective',
      customRobotsTxt: 'Disallow: /admin'
    });

    const output = await optimizer.optimize(mockPages, 'dist');
    const robots = output.files['robots.txt'];

    expect(robots).toContain('User-agent: GPTBot');
    expect(robots).toContain('Allow: /llms.txt');
    expect(robots).toContain('Disallow: /');
    expect(robots).toContain('Crawl-delay: 5');
    expect(robots).toContain('Sitemap: https://depthindex.js.org/sitemap.xml');
    expect(robots).toContain('Disallow: /admin');
  });

  it('should generate structured JSON-LD schemas', async () => {
    const optimizer = new SEOOptimizer({
      siteName: 'DepthIndex Docs',
      siteDescription: 'Search indexing library',
      siteUrl: 'https://depthindex.js.org',
      author: 'Eldrex'
    });

    const output = await optimizer.optimize(mockPages, 'dist');
    expect(output.structuredData.website).toBeDefined();
    expect(output.structuredData.website['@type']).toBe('WebSite');
    expect(output.structuredData.website.potentialAction.target.urlTemplate).toContain('/search?q={search_term_string}');
    expect(output.structuredData.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should generate llms.txt and .well-known/ai.json endpoints', async () => {
    const optimizer = new SEOOptimizer({
      siteName: 'DepthIndex Docs',
      siteDescription: 'Search indexing library',
      siteUrl: 'https://depthindex.js.org',
    });

    const output = await optimizer.optimize(mockPages, 'dist');

    const llmsTxt = output.files['llms.txt'];
    const aiJson = JSON.parse(output.files['.well-known/ai.json']);

    expect(llmsTxt).toContain('# DepthIndex Docs Documentation');
    expect(llmsTxt).toContain('URL: https://depthindex.js.org/');
    expect(aiJson.endpoints.fullText).toBe('https://depthindex.js.org/llms.txt');
    expect(aiJson.endpoints.searchIndex).toBe('https://depthindex.js.org/assets/depth-index.json');
  });

  it('should inject meta tags into html header', async () => {
    const optimizer = new SEOOptimizer({
      siteName: 'DepthIndex Docs',
      siteDescription: 'Search indexing library',
      siteUrl: 'https://depthindex.js.org',
      googleSiteVerification: 'google-code-123'
    });

    const output = await optimizer.optimize(mockPages, 'dist');
    const tags = output.pageMetaTags.get('/');
    expect(tags).toBeDefined();

    const html = '<html><head><meta charset="utf-8"></head><body></body></html>';
    const injector = new MetaTagInjector();
    const injectedHtml = injector.injectMetaTags(html, tags!);

    expect(injectedHtml).toContain('<title>Home Page | DepthIndex Docs</title>');
    expect(injectedHtml).toContain('<meta name="google-site-verification" content="google-code-123">');
    expect(injectedHtml).toContain('<meta property="og:type" content="website">');
    expect(injectedHtml).toContain('<script type="application/ld+json">');
  });

  it('should optimize free domains with extra boost tags and index guidelines', () => {
    const isFree = FreeDomainOptimizer.isFreeDomain('https://depthindex.vercel.app');
    expect(isFree).toBe(true);

    const boost = FreeDomainOptimizer.generateFreeDomainBoost({
      siteUrl: 'https://depthindex.vercel.app',
      siteName: 'DepthIndex Vercel Demo',
      description: 'Demo description'
    });

    expect(boost.additionalMeta).toContain('<meta name="revisit-after" content="1 days">');
    expect(boost.socialSignals).toContain('<meta property="article:author"');
    expect(boost.submissionGuide).toContain('Free Domain Indexing Tips');
  });

});
