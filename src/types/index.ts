export interface ExtractedPage {
  url: string;
  title: string;
  headings: { level: number; text: string; id: string }[];
  sections: {
    heading: string;
    content: string;
    codeBlocks: { language: string; code: string }[];
    mermaidDiagrams: string[];
    links: { text: string; url: string; internal: boolean }[];
  }[];
  frontmatter: Record<string, any>;
  lastModified: number;
}

export interface PageChunk {
  id: string; // e.g. "url#section-id-index"
  url: string;
  pageTitle: string;
  heading: string;
  content: string;
  codeBlocks: { language: string; code: string }[];
  mermaidDiagrams: string[];
  links: { text: string; url: string; internal: boolean }[];
}

export interface SerializedIndex {
  vocabulary: string[];
  idf: number[];
  chunks: {
    id: string;
    url: string;
    pageTitle: string;
    heading: string;
    content: string;
    vector: number[]; // Quantized or compressed vector indices or dense array
    codeBlocks?: { language: string; code: string }[];
    mermaidDiagrams?: string[];
  }[];
  // posting list for exact match BM25
  invertedIndex: Record<string, [number, number][]>; // term -> Array of [chunkIndex, termFrequency]
}

export interface SEOConfig {
  siteUrl?: string;          // Override default domain detection
  siteName: string;
  siteDescription: string;
  author?: string;
  twitterHandle?: string;
  defaultImage?: string;     // Fallback OG image
  locale?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  yandexVerification?: string;
  customRobotsTxt?: string;  // Additional robots.txt rules
  aiCrawlerPolicy?: 'allow' | 'disallow' | 'selective';
  autoSubmitToGoogle?: boolean; // Hints for Google Indexing API
  generateAISitemap?: boolean;  // Separate sitemap for AI crawlers
}

export interface MetaTagSet {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogType: string;
  ogImage: string;
  ogSiteName: string;
  ogLocale: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterHandle?: string;
  aiContent: string;
  aiIndex: string;
  aiSection: string;
  aiKeywords: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  yandexVerification?: string;
  robots: string;
  googlebot: string;
  structuredData: any;
}

export interface DepthIndexOptions {
  searchMode: 'on-device' | 'cloud' | 'hybrid';
  cloudAPI?: {
    provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
    endpoint?: string;
    model?: string;
    apiKey?: string;
  };
  indexConfig: {
    chunkSize: number;
    overlapSize: number;
    excludePages: string[];
    includeCodeBlocks: boolean;
    includeMermaid: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    position: 'bottom-right' | 'bottom-left';
    showFloatingButton: boolean;
    enableFullscreen: boolean;
    enableModal: boolean;
  };
  personalization: {
    enabled: boolean;
    storage: 'localStorage' | 'indexedDB';
  };
  offline: {
    enabled: boolean;
    cacheStrategy: 'network-first' | 'cache-first';
  };
  llmText: {
    enabled: boolean;
    formats: ('txt' | 'jsonl' | 'markdown')[];
    includeMetadata: boolean;
  };
  seo?: SEOConfig;
  extensions?: any[];
}

export interface SearchResult {
  chunk: {
    id: string;
    url: string;
    pageTitle: string;
    heading: string;
    content: string;
    codeBlocks?: { language: string; code: string }[];
    mermaidDiagrams?: string[];
  };
  score: number;
  cosineScore: number;
  bm25Score: number;
}
