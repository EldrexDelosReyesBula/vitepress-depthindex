import { ExtractedPage, SEOConfig, MetaTagSet } from '../types/index.js';

const DEPTHINDEX_VERSION = '1.0.1';

export interface SEOPageData {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  lastModified: string;
  headings: string[];
  firstParagraph: string;
  hasCode: boolean;
  hasMermaid: boolean;
  images: Array<{ src: string; alt: string }>;
  section: string;
  priority: number; // 0.0 - 1.0
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export interface SEOOutput {
  files: Record<string, string>;
  pageMetaTags: Map<string, MetaTagSet>;
  structuredData: Record<string, any>;
  submissionHints: string;
}

export class SEOOptimizer {
  private config: SEOConfig;
  private pages: SEOPageData[] = [];
  
  // Priority scoring rules
  private readonly PRIORITY_RULES = {
    homepage: 1.0,
    gettingStarted: 0.9,
    guide: 0.8,
    api: 0.8,
    reference: 0.7,
    example: 0.6,
    changelog: 0.4,
    default: 0.5,
  };
  
  constructor(config: SEOConfig) {
    this.config = {
      locale: 'en_US',
      aiCrawlerPolicy: 'allow',
      generateAISitemap: true,
      ...config,
    };
  }
  
  /**
   * Process all pages and generate SEO artifacts
   */
  async optimize(pages: ExtractedPage[], outDir: string): Promise<SEOOutput> {
    // Step 1: Extract SEO data from all pages
    this.pages = pages.map(page => this.extractSEOPageData(page));
    
    // Step 2: Generate all SEO files
    const sitemap = this.generateSitemap();
    const robotsTxt = this.generateRobotsTxt();
    const structuredData = this.generateStructuredData();
    const aiCrawlerGuide = this.generateAICrawlerGuide();
    const wellKnownAI = this.generateWellKnownAI();
    
    // Step 3: Generate per-page meta tags
    const pageMetaTags = this.generatePageMetaTags();
    
    // Step 4: Generate submission hints
    const submissionHints = this.generateSubmissionHints();
    
    return {
      files: {
        'sitemap.xml': sitemap,
        'robots.txt': robotsTxt,
        'llms.txt': aiCrawlerGuide.fullText,
        'llms.jsonl': aiCrawlerGuide.jsonl,
        '.well-known/ai.json': wellKnownAI,
      },
      pageMetaTags,
      structuredData,
      submissionHints,
    };
  }
  
  /**
   * Extract SEO-relevant data from a page
   */
  private extractSEOPageData(page: ExtractedPage): SEOPageData {
    // Determine priority based on URL path
    const priority = this.calculatePriority(page.url);
    
    // Extract description from first paragraph or frontmatter
    const description = page.frontmatter?.description 
      || this.extractFirstParagraph(page)
      || this.config.siteDescription;
    
    // Extract keywords from headings and content
    const keywords = this.extractKeywords(page);
    
    // Extract images with alt text
    const images = this.extractImages(page);
    
    // Determine section from URL
    const section = this.determineSection(page.url);
    
    return {
      url: page.url,
      title: page.title || page.frontmatter?.title || '',
      description: description.substring(0, 160),
      keywords,
      lastModified: page.lastModified 
        ? new Date(page.lastModified).toISOString() 
        : new Date().toISOString(),
      headings: page.headings?.map(h => h.text) || [],
      firstParagraph: this.extractFirstParagraph(page) || '',
      hasCode: page.sections?.some(s => s.codeBlocks?.length > 0) || false,
      hasMermaid: page.sections?.some(s => s.mermaidDiagrams?.length > 0) || false,
      images,
      section,
      priority,
      changeFrequency: this.determineChangeFrequency(page.url),
    };
  }
  
  /**
   * Calculate page priority for sitemap
   */
  private calculatePriority(url: string): number {
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    if (cleanUrl === '/' || cleanUrl === '/index' || cleanUrl === '/index.html') return this.PRIORITY_RULES.homepage;
    if (cleanUrl.includes('/getting-started') || cleanUrl.includes('/quick-start')) return this.PRIORITY_RULES.gettingStarted;
    if (cleanUrl.includes('/guide/') || cleanUrl.includes('/tutorial/')) return this.PRIORITY_RULES.guide;
    if (cleanUrl.includes('/api/') || cleanUrl.includes('/reference/')) return this.PRIORITY_RULES.api;
    if (cleanUrl.includes('/examples/') || cleanUrl.includes('/demo/')) return this.PRIORITY_RULES.example;
    if (cleanUrl.includes('/changelog') || cleanUrl.includes('/releases')) return this.PRIORITY_RULES.changelog;
    return this.PRIORITY_RULES.default;
  }
  
  /**
   * Generate sitemap.xml
   */
  generateSitemap(): string {
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
    
    for (const page of this.pages) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(baseUrl)}${this.escapeXml(page.url)}</loc>\n`;
      xml += `    <lastmod>${page.lastModified}</lastmod>\n`;
      xml += `    <changefreq>${page.changeFrequency}</changefreq>\n`;
      xml += `    <priority>${page.priority.toFixed(1)}</priority>\n`;
      
      // Add images
      for (const image of page.images) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${this.escapeXml(baseUrl)}${this.escapeXml(image.src)}</image:loc>\n`;
        if (image.alt) {
          xml += `      <image:caption>${this.escapeXml(image.alt)}</image:caption>\n`;
        }
        xml += '    </image:image>\n';
      }
      
      xml += '  </url>\n';
    }
    
    // Add special URLs
    xml += '  <!-- AI-accessible content -->\n';
    xml += '  <url>\n';
    xml += `    <loc>${this.escapeXml(baseUrl)}/llms.txt</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
    
    xml += '  <url>\n';
    xml += `    <loc>${this.escapeXml(baseUrl)}/.well-known/ai.json</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
    
    xml += '</urlset>';
    
    return xml;
  }
  
  /**
   * Generate robots.txt with AI crawler directives
   */
  generateRobotsTxt(): string {
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    let txt = `# robots.txt for ${this.config.siteName}\n`;
    txt += `# Generated by VitePress DepthIndex\n`;
    txt += `# Version: ${DEPTHINDEX_VERSION}\n\n`;
    
    // Standard crawlers
    txt += `# ─── Standard Search Engines ───\n`;
    txt += `User-agent: *\n`;
    txt += `Allow: /\n`;
    txt += `Disallow: /assets/depth-index.json  # Internal search index\n\n`;
    
    // Google-specific
    txt += `# ─── Google Crawlers ───\n`;
    txt += `User-agent: Googlebot\n`;
    txt += `Allow: /\n`;
    txt += `Disallow: /assets/depth-index.json\n\n`;
    
    txt += `User-agent: Googlebot-Image\n`;
    txt += `Allow: /\n\n`;
    
    txt += `User-agent: Googlebot-Video\n`;
    txt += `Allow: /\n\n`;
    
    // AI Crawlers
    txt += `# ─── AI Crawlers ───\n`;
    
    if (this.config.aiCrawlerPolicy === 'allow') {
      txt += `# AI crawlers are welcome to index this documentation\n`;
      txt += `User-agent: GPTBot\n`;
      txt += `Allow: /\n`;
      txt += `Disallow: /assets/depth-index.json\n\n`;
      
      txt += `User-agent: ChatGPT-User\n`;
      txt += `Allow: /\n\n`;
      
      txt += `User-agent: Google-Extended\n`;
      txt += `Allow: /\n`;
      txt += `Disallow: /assets/depth-index.json\n\n`;
      
      txt += `User-agent: Claude-Web\n`;
      txt += `Allow: /\n\n`;
      
      txt += `User-agent: anthropic-ai\n`;
      txt += `Allow: /\n\n`;
      
      txt += `User-agent: cohere-ai\n`;
      txt += `Allow: /\n\n`;
      
      txt += `User-agent: PerplexityBot\n`;
      txt += `Allow: /\n\n`;
      
      txt += `User-agent: YouBot\n`;
      txt += `Allow: /\n\n`;
      
      txt += `User-agent: CCBot\n`;
      txt += `Allow: /\n\n`;
    } else if (this.config.aiCrawlerPolicy === 'selective') {
      txt += `User-agent: GPTBot\n`;
      txt += `Allow: /llms.txt\n`;
      txt += `Allow: /.well-known/ai.json\n`;
      txt += `Disallow: /\n\n`;
    } else {
      txt += `User-agent: GPTBot\n`;
      txt += `Disallow: /\n\n`;
      txt += `User-agent: Google-Extended\n`;
      txt += `Disallow: /\n\n`;
    }
    
    // Crawl delay (be nice to free hosting)
    txt += `# ─── Rate Limiting ───\n`;
    txt += `Crawl-delay: 5\n\n`;
    
    // Sitemaps
    txt += `# ─── Sitemaps ───\n`;
    txt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    
    if (this.config.generateAISitemap) {
      txt += `# AI-specific content index\n`;
      txt += `Sitemap: ${baseUrl}/llms.txt\n`;
    }
    
    // Custom rules
    if (this.config.customRobotsTxt) {
      txt += `\n# ─── Custom Rules ───\n`;
      txt += this.config.customRobotsTxt;
    }
    
    return txt;
  }
  
  /**
   * Generate structured data (Schema.org JSON-LD)
   */
  generateStructuredData(): Record<string, any> {
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    return {
      // WebSite schema with SearchAction
      website: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: this.config.siteName,
        description: this.config.siteDescription,
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      
      // Organization or Person
      organization: this.config.author ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: this.config.siteName,
        url: baseUrl,
        description: this.config.siteDescription,
      } : undefined,
      
      // BreadcrumbList for each page
      breadcrumbs: this.generateBreadcrumbStructuredData(baseUrl),
      
      // FAQ schema from FAQ pages
      faq: this.generateFAQStructuredData(),
      
      // HowTo schema from guide pages
      howTo: this.generateHowToStructuredData(),
    };
  }
  
  /**
   * Generate BreadcrumbList for all pages
   */
  private generateBreadcrumbStructuredData(baseUrl: string): any[] {
    const breadcrumbs: any[] = [];
    
    for (const page of this.pages) {
      const pathParts = page.url.split('/').filter(Boolean);
      
      if (pathParts.length > 0) {
        const itemListElement: any[] = [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
        ];
        
        let currentPath = '';
        for (let i = 0; i < pathParts.length; i++) {
          currentPath += '/' + pathParts[i];
          itemListElement.push({
            '@type': 'ListItem',
            position: i + 2,
            name: this.urlToTitle(pathParts[i]),
            item: `${baseUrl}${currentPath}`,
          });
        }
        
        breadcrumbs.push({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement,
        });
      }
    }
    
    return breadcrumbs;
  }
  
  /**
   * Generate FAQ structured data from FAQ pages
   */
  private generateFAQStructuredData(): any[] {
    const faqPages = this.pages.filter(p => 
      p.url.includes('/faq') || 
      p.url.includes('/troubleshooting') ||
      p.headings.some(h => h.toLowerCase().includes('faq'))
    );
    
    const faqData: any[] = [];
    
    for (const page of faqPages) {
      // Extract Q&A pairs from content
      const qaPairs = this.extractQAPairs(page);
      
      if (qaPairs.length > 0) {
        faqData.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: qaPairs.map(qa => ({
            '@type': 'Question',
            name: qa.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: qa.answer.substring(0, 500),
            },
          })),
        });
      }
    }
    
    return faqData;
  }
  
  /**
   * Generate HowTo structured data from guide pages
   */
  private generateHowToStructuredData(): any[] {
    const guidePages = this.pages.filter(p => 
      p.url.includes('/guide/') || 
      p.url.includes('/tutorial/') ||
      p.headings.some(h => 
        h.toLowerCase().includes('how to') || 
        h.toLowerCase().includes('step')
      )
    );
    
    const howToData: any[] = [];
    
    for (const page of guidePages.slice(0, 5)) {
      const steps = this.extractStepsFromPage(page);
      
      if (steps.length > 0) {
        howToData.push({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: page.title,
          description: page.description,
          step: steps.map((step, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: step.title || `Step ${i + 1}`,
            text: step.content.substring(0, 500),
          })),
        });
      }
    }
    
    return howToData;
  }
  
  /**
   * Generate AI crawler guide (llms.txt + JSONL)
   */
  generateAICrawlerGuide(): { fullText: string; jsonl: string } {
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    // Full text version
    let fullText = `# ${this.config.siteName} Documentation\n`;
    fullText += `# Generated for AI crawlers and LLM training\n`;
    fullText += `# URL: ${baseUrl}\n`;
    fullText += `# Last updated: ${new Date().toISOString()}\n\n`;
    
    // JSONL version
    let jsonl = '';
    
    for (const page of this.pages) {
      // Full text
      fullText += `## ${page.title}\n`;
      fullText += `URL: ${baseUrl}${page.url}\n`;
      fullText += `Description: ${page.description}\n`;
      fullText += `Keywords: ${page.keywords.join(', ')}\n`;
      fullText += `Last Modified: ${page.lastModified}\n\n`;
      fullText += `${page.firstParagraph}\n\n`;
      fullText += `---\n\n`;
      
      // JSONL
      jsonl += JSON.stringify({
        url: `${baseUrl}${page.url}`,
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        content: page.firstParagraph,
        lastModified: page.lastModified,
        hasCode: page.hasCode,
        section: page.section,
      }) + '\n';
    }
    
    return { fullText, jsonl };
  }
  
  /**
   * Generate .well-known/ai.json for AI discoverability
   */
  generateWellKnownAI(): string {
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    return JSON.stringify({
      name: this.config.siteName,
      description: this.config.siteDescription,
      url: baseUrl,
      version: DEPTHINDEX_VERSION,
      
      // AI-accessible endpoints
      endpoints: {
        fullText: `${baseUrl}/llms.txt`,
        jsonl: `${baseUrl}/llms.jsonl`,
        sitemap: `${baseUrl}/sitemap.xml`,
        searchIndex: `${baseUrl}/assets/depth-index.json`,
      },
      
      // Content metadata
      content: {
        totalPages: this.pages.length,
        sections: [...new Set(this.pages.map(p => p.section))],
        hasCodeExamples: this.pages.some(p => p.hasCode),
        hasDiagrams: this.pages.some(p => p.hasMermaid),
        lastUpdated: new Date().toISOString(),
      },
      
      // Crawler policies
      crawlerPolicy: {
        ai: this.config.aiCrawlerPolicy,
        standard: 'allow',
        robotsTxt: `${baseUrl}/robots.txt`,
      },
      
      // Schema.org compatibility
      schemaOrg: {
        type: 'WebSite',
        searchAction: true,
        breadcrumbs: true,
        faq: this.pages.some(p => p.url.includes('/faq')),
        howTo: this.pages.some(p => p.url.includes('/guide/')),
      },
    }, null, 2);
  }
  
  /**
   * Generate per-page meta tags for HTML injection
   */
  private generatePageMetaTags(): Map<string, MetaTagSet> {
    const tags = new Map<string, MetaTagSet>();
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    for (const page of this.pages) {
      const pageUrl = `${baseUrl}${page.url}`;
      
      tags.set(page.url, {
        // Standard meta
        title: `${page.title} | ${this.config.siteName}`,
        description: page.description,
        keywords: page.keywords.join(', '),
        canonical: pageUrl,
        
        // Open Graph
        ogTitle: page.title,
        ogDescription: page.description,
        ogUrl: pageUrl,
        ogType: page.url === '/' ? 'website' : 'article',
        ogImage: this.config.defaultImage || `${baseUrl}/og-image.png`,
        ogSiteName: this.config.siteName,
        ogLocale: this.config.locale || 'en_US',
        
        // Twitter Card
        twitterCard: 'summary_large_image',
        twitterTitle: page.title,
        twitterDescription: page.description,
        twitterImage: this.config.defaultImage || `${baseUrl}/og-image.png`,
        twitterHandle: this.config.twitterHandle,
        
        // AI-specific meta
        aiContent: 'documentation',
        aiIndex: 'allow',
        aiSection: page.section,
        aiKeywords: page.keywords.join(', '),
        
        // Verification
        googleSiteVerification: this.config.googleSiteVerification,
        bingSiteVerification: this.config.bingSiteVerification,
        yandexVerification: this.config.yandexVerification,
        
        // Robots
        robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
        googlebot: 'index, follow, max-snippet:-1, max-image-preview:large',
        
        // Structured data
        structuredData: this.generatePageStructuredData(page, baseUrl),
      });
    }
    
    return tags;
  }
  
  /**
   * Generate submission hints for Google Indexing API
   */
  private generateSubmissionHints(): string {
    const baseUrl = this.config.siteUrl || 'https://your-docs.example.com';
    
    return `
<!-- 
  ╔══════════════════════════════════════════════════════════╗
  ║  GOOGLE INDEXING SUBMISSION HINTS                       ║
  ╚══════════════════════════════════════════════════════════╝
  
  To submit your documentation to Google for faster indexing:
  
  1. Google Search Console (Recommended)
     - Visit: https://search.google.com/search-console
     - Add property: ${baseUrl}
     - Submit sitemap: ${baseUrl}/sitemap.xml
     - Use URL Inspection tool for individual pages
  
  2. Google Indexing API (Programmatic)
     POST https://indexing.googleapis.com/v3/urlNotifications:publish
     {
       "url": "${baseUrl}",
       "type": "URL_UPDATED"
     }
     Requires: Service account with Indexing API enabled
  
  3. Bing Webmaster Tools
     - Visit: https://www.bing.com/webmasters
     - Add site: ${baseUrl}
     - Submit sitemap: ${baseUrl}/sitemap.xml
  
  4. Manual Submission (No account needed)
     - Visit: https://www.google.com/ping?sitemap=${encodeURIComponent(baseUrl + '/sitemap.xml')}
     
  5. AI Crawler Notification
     - llms.txt is at: ${baseUrl}/llms.txt
     - AI discovery endpoint: ${baseUrl}/.well-known/ai.json
     - These files help GPTBot, Claude, and other AI crawlers find your content
     
  Even on free domains (vercel.app, netlify.app, github.io):
  - Google will index your pages automatically within days/weeks
  - Submitting a sitemap speeds up discovery significantly
  - AI crawlers prioritize sites with llms.txt
-->
`;
  }
  
  // Helper methods
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  private urlToTitle(url: string): string {
    return url
      .replace(/-/g, ' ')
      .replace(/\//g, '')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  
  private determineSection(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[0] || 'home';
  }
  
  private determineChangeFrequency(url: string): 'weekly' | 'monthly' | 'daily' {
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    if (cleanUrl === '/' || cleanUrl.includes('/changelog')) return 'daily';
    if (cleanUrl.includes('/guide/') || cleanUrl.includes('/api/')) return 'weekly';
    return 'monthly';
  }
  
  private extractFirstParagraph(page: ExtractedPage): string {
    const firstSection = page.sections?.[0];
    if (firstSection?.content) {
      return firstSection.content.split('\n\n')[0]?.trim() || '';
    }
    return '';
  }
  
  private extractKeywords(page: ExtractedPage): string[] {
    const keywords = new Set<string>();
    
    // From frontmatter
    if (page.frontmatter?.keywords) {
      const kw = page.frontmatter.keywords;
      (Array.isArray(kw) ? kw : [kw]).forEach(k => keywords.add(k.toString().toLowerCase()));
    }
    
    // From headings
    page.headings?.forEach(h => {
      h.text.toLowerCase().split(/\s+/)
        .filter(w => w.length > 3)
        .forEach(w => keywords.add(w));
    });
    
    // From code blocks
    page.sections?.forEach(s => {
      s.codeBlocks?.forEach(cb => {
        if (cb.language) keywords.add(cb.language.toLowerCase());
      });
    });
    
    return [...keywords].slice(0, 20);
  }
  
  private extractImages(page: ExtractedPage): Array<{ src: string; alt: string }> {
    const images: Array<{ src: string; alt: string }> = [];
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    
    for (const section of page.sections || []) {
      imgRegex.lastIndex = 0;
      while ((match = imgRegex.exec(section.content)) !== null) {
        images.push({ src: match[2], alt: match[1] });
      }
    }
    
    return images;
  }
  
  private extractQAPairs(page: SEOPageData): Array<{ question: string; answer: string }> {
    const qaPairs: Array<{ question: string; answer: string }> = [];
    return qaPairs;
  }
  
  private extractStepsFromPage(page: SEOPageData): Array<{ title: string; content: string }> {
    return page.headings
      .filter(h => /\d+\./.test(h) || /step/i.test(h))
      .map(h => ({ title: h, content: '' }));
  }
  
  private generatePageStructuredData(page: SEOPageData, baseUrl: string): any {
    const pageUrl = `${baseUrl}${page.url}`;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: page.title,
      description: page.description,
      url: pageUrl,
      dateModified: page.lastModified,
      author: this.config.author ? {
        '@type': 'Organization',
        name: this.config.author,
      } : undefined,
      publisher: {
        '@type': 'Organization',
        name: this.config.siteName,
      },
      keywords: page.keywords.join(', '),
      ...(page.hasCode ? { programmingLanguage: page.keywords.find(k => 
        ['javascript', 'typescript', 'python', 'rust', 'go'].includes(k)
      )} : {}),
    };
  }
}
