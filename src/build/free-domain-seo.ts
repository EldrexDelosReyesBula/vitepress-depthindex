/**
 * Special optimizations for free domains (vercel.app, netlify.app, github.io, etc.)
 * These domains have lower crawl priority, so we compensate aggressively.
 */
export class FreeDomainOptimizer {
  private static readonly FREE_DOMAIN_PATTERNS = [
    /\.vercel\.app$/,
    /\.netlify\.app$/,
    /\.github\.io$/,
    /\.gitlab\.io$/,
    /\.pages\.dev$/,
    /\.surge\.sh$/,
    /\.onrender\.com$/,
    /\.fly\.dev$/,
  ];
  
  /**
   * Check if the site is on a free domain
   */
  static isFreeDomain(url: string): boolean {
    return this.FREE_DOMAIN_PATTERNS.some(pattern => pattern.test(url));
  }
  
  /**
   * Generate additional SEO signals for free domains
   */
  static generateFreeDomainBoost(seoData: {
    siteUrl: string;
    siteName: string;
    description: string;
  }): {
    additionalMeta: string;
    submissionGuide: string;
    socialSignals: string;
  } {
    return {
      additionalMeta: `
  <!-- Free Domain SEO Boost -->
  <meta name="revisit-after" content="1 days">
  <meta name="rating" content="general">
  <meta name="distribution" content="global">
  <meta name="coverage" content="Worldwide">
  <link rel="me" href="https://github.com/your-org/your-repo">
  <link rel="author" href="https://github.com/your-org">`,
      
      submissionGuide: `
  <!-- 
    Free Domain Indexing Tips:
    1. Submit to Google Search Console immediately
    2. Share your docs URL on social media (Twitter, LinkedIn)
    3. Link from your GitHub README
    4. Submit to directories: https://github.com/awesome-selfhosted
    5. Create a YouTube tutorial linking to your docs
    6. Post on Reddit, Dev.to, Hashnode with doc links
    7. Use Google Indexing API for instant submission
  -->`,
      
      socialSignals: `
  <!-- Social Proof for Better Indexing -->
  <meta property="article:author" content="https://github.com/your-org">
  <meta property="article:publisher" content="https://github.com/your-org">
  <meta name="citation_author" content="Your Name">
  <meta name="citation_title" content="${seoData.siteName}">
  <meta name="citation_publication_date" content="${new Date().toISOString().split('T')[0]}">`,
    };
  }
}
