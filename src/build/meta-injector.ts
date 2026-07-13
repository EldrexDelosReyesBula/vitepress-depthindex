import { MetaTagSet } from '../types/index.js';

export class MetaTagInjector {
  /**
   * Inject meta tags into HTML pages during build
   */
  injectMetaTags(html: string, metaTags: MetaTagSet): string {
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex === -1) return html;
    
    const before = html.substring(0, headEndIndex);
    const after = html.substring(headEndIndex);
    
    let metaBlock = '\n  <!-- DepthIndex SEO Meta Tags -->\n';
    
    // Standard meta
    metaBlock += `  <title>${this.escapeHtml(metaTags.title)}</title>\n`;
    metaBlock += `  <meta name="description" content="${this.escapeHtml(metaTags.description)}">\n`;
    metaBlock += `  <meta name="keywords" content="${this.escapeHtml(metaTags.keywords)}">\n`;
    metaBlock += `  <link rel="canonical" href="${this.escapeHtml(metaTags.canonical)}">\n`;
    metaBlock += `  <meta name="robots" content="${metaTags.robots}">\n`;
    metaBlock += `  <meta name="googlebot" content="${metaTags.googlebot}">\n`;
    
    // Open Graph
    metaBlock += `\n  <!-- Open Graph -->\n`;
    metaBlock += `  <meta property="og:title" content="${this.escapeHtml(metaTags.ogTitle)}">\n`;
    metaBlock += `  <meta property="og:description" content="${this.escapeHtml(metaTags.ogDescription)}">\n`;
    metaBlock += `  <meta property="og:url" content="${this.escapeHtml(metaTags.ogUrl)}">\n`;
    metaBlock += `  <meta property="og:type" content="${metaTags.ogType}">\n`;
    metaBlock += `  <meta property="og:image" content="${this.escapeHtml(metaTags.ogImage)}">\n`;
    metaBlock += `  <meta property="og:site_name" content="${this.escapeHtml(metaTags.ogSiteName)}">\n`;
    metaBlock += `  <meta property="og:locale" content="${metaTags.ogLocale}">\n`;
    
    // Twitter Card
    metaBlock += `\n  <!-- Twitter Card -->\n`;
    metaBlock += `  <meta name="twitter:card" content="${metaTags.twitterCard}">\n`;
    metaBlock += `  <meta name="twitter:title" content="${this.escapeHtml(metaTags.twitterTitle)}">\n`;
    metaBlock += `  <meta name="twitter:description" content="${this.escapeHtml(metaTags.twitterDescription)}">\n`;
    metaBlock += `  <meta name="twitter:image" content="${this.escapeHtml(metaTags.twitterImage)}">\n`;
    if (metaTags.twitterHandle) {
      metaBlock += `  <meta name="twitter:site" content="${this.escapeHtml(metaTags.twitterHandle)}">\n`;
    }
    
    // AI crawler directives
    metaBlock += `\n  <!-- AI Crawler Directives -->\n`;
    metaBlock += `  <meta name="ai-content" content="${metaTags.aiContent}">\n`;
    metaBlock += `  <meta name="ai-index" content="${metaTags.aiIndex}">\n`;
    metaBlock += `  <meta name="ai-section" content="${metaTags.aiSection}">\n`;
    
    // Verification tags
    if (metaTags.googleSiteVerification) {
      metaBlock += `\n  <!-- Site Verification -->\n`;
      metaBlock += `  <meta name="google-site-verification" content="${metaTags.googleSiteVerification}">\n`;
    }
    if (metaTags.bingSiteVerification) {
      metaBlock += `  <meta name="msvalidate.01" content="${metaTags.bingSiteVerification}">\n`;
    }
    if (metaTags.yandexVerification) {
      metaBlock += `  <meta name="yandex-verification" content="${metaTags.yandexVerification}">\n`;
    }
    
    // Structured data
    metaBlock += `\n  <!-- Structured Data -->\n`;
    metaBlock += `  <script type="application/ld+json">\n`;
    metaBlock += `    ${JSON.stringify(metaTags.structuredData, null, 2).replace(/\n/g, '\n    ')}\n`;
    metaBlock += `  </script>\n`;
    
    return before + metaBlock + after;
  }
  
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
