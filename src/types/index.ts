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

export interface PageContext {
  title: string;
  section: string;
  relatedPages: string[];
  /** Approximate character count of page content */
  contentLength?: number;
  /** Whether the page contains code blocks */
  hasCodeBlocks?: boolean;
  /** Whether the page contains configuration examples */
  hasConfig?: boolean;
  /** Canonical URL of the current page */
  url?: string;
}

export interface DocGroup {
  header: string;
  items: string[];
}

export interface DocStructure {
  groups: DocGroup[];
}

export interface SiteProfile {
  name: string;
  description: string;
  type: 'library' | 'api' | 'tool' | 'other';
  structure: DocStructure;
  topics: string[];
  currentPage: PageContext;
}

export interface PlacementConfig {
  mode: 'search-bar' | 'panel' | 'cta' | 'both' | 'all';
  searchBarSelector?: string;
}

export interface SearchBarConfig {
  enabled?: boolean;
  position?: 'top' | 'bottom';
  maxAnswerLength?: number;
  showExpandButton?: boolean;
  placeholder?: string;
  logo?: {
    src?: string;
    icon?: string;
    alt?: string;
  };
  shortcut?: string;
}

export interface PanelConfig {
  enabled?: boolean;
  position?: 'right' | 'left';
  defaultSize?: 'compact' | 'normal' | 'fullscreen';
  showHistory?: boolean;
  logo?: {
    src?: string;
    icon?: string;
    alt?: string;
  };
  title?: string;
  subtitle?: string;
  showSettings?: boolean;
}

export interface FloatingButtonConfig {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: string;
  pulse?: boolean;
  label?: string;
}

export interface DepthIndexOptions {
  searchMode?: 'on-device' | 'cloud' | 'hybrid';
  placement?: PlacementConfig;
  searchBar?: SearchBarConfig;
  panel?: PanelConfig;
  floatingButton?: FloatingButtonConfig;
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
    showSettingsButton?: boolean;
    defaultSize?: 'compact' | 'normal' | 'fullscreen';
    customClass?: string;
    triggerIcon?: string;
    title?: string;
  };
  features?: {
    allowUserCloudConfig?: boolean;
    showAttribution?: boolean;
    allowEdit?: boolean;
    allowFeedback?: boolean;
  };
  personalization: {
    enabled: boolean;
    storage: 'localStorage' | 'indexedDB';
    /** Maximum number of query history entries to keep. @default 20 */
    maxHistory?: number;
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
  analytics?: {
    enabled?: boolean;
    storage?: 'indexeddb' | 'localstorage' | 'memory' | 'none';
    externalEndpoint?: string;
    externalHeaders?: Record<string, string>;
    batchSize?: number;
    flushInterval?: number;
    maxEvents?: number;
    trackedCategories?: ('search' | 'click' | 'feedback' | 'error' | 'session' | 'navigation')[];
    excludePages?: string[];
    notice?: NoticeConfig;
  };
  privacy?: {
    showNotice?: boolean;
    privacyPolicyUrl?: string;
  };
  language?: LanguageConfig;
  settings?: SettingsConfig;
  ai?: {
    personality?: AIPersonalityConfig;
    logo?: {
      src?: string;
      alt?: string;
      size?: 'sm' | 'md' | 'lg';
      position?: 'header' | 'welcome' | 'both';
    };
  };
  usageLimits?: UsageLimitsConfig;
}

export interface LanguageConfig {
  default?: string;
  allowUserChange?: boolean;
  availableLanguages?: string[];
  forceLanguage?: string;
  translateAnswers?: boolean;
  communityTranslationsUrl?: string;
}

export interface SettingsConfig {
  showSettings?: boolean;
  allowCloudConfig?: boolean;
  allowModeChange?: boolean;
  allowLanguageChange?: boolean;
  hiddenSections?: ('cloud' | 'mode' | 'language' | 'history')[];
}

export interface AIPersonalityConfig {
  preset?: 'professional' | 'friendly' | 'concise' | 'teacher' | 'mentor' | 'custom';
  customPrompt?: string;
  tone?: {
    formality?: 'casual' | 'neutral' | 'formal';
    enthusiasm?: 'reserved' | 'balanced' | 'enthusiastic';
    verbosity?: 'concise' | 'balanced' | 'detailed';
    emojis?: 'none' | 'minimal' | 'moderate';
    firstPerson?: boolean;
  };
  behavior?: {
    alwaysCite?: boolean;
    suggestFollowUps?: boolean;
    admitUncertainty?: boolean;
    offerElaboration?: boolean;
    greeting?: 'warm' | 'brief' | 'none';
  };
  logo?: {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    position?: 'header' | 'welcome' | 'both';
  };
}

export interface UsageLimitsConfig {
  tokens?: {
    maxPerRequest?: number;
    maxPerUserPerDay?: number;
    maxPerUserPerMonth?: number;
    maxContextTokens?: number;
    maxResponseTokens?: number;
  };
  response?: {
    localMaxChars?: number;
    cloudMaxChars?: number;
    inlineMaxChars?: number;
    truncationMessage?: string;
  };
  rateLimit?: {
    queriesPerMinute?: number;
    queriesPerHour?: number;
    cooldownMessage?: string;
  };
  subscription?: {
    enabled?: boolean;
    checkAccess?: () => Promise<boolean>;
    upgradeMessage?: string;
    upgradeUrl?: string;
  };
}

export const PERSONALITY_PRESETS: Record<string, AIPersonalityConfig> = {
  professional: {
    tone: {
      formality: 'formal',
      enthusiasm: 'reserved',
      verbosity: 'balanced',
      emojis: 'none',
      firstPerson: false,
    },
    behavior: {
      alwaysCite: true,
      suggestFollowUps: true,
      admitUncertainty: true,
      offerElaboration: true,
      greeting: 'brief',
    },
  },
  friendly: {
    tone: {
      formality: 'casual',
      enthusiasm: 'enthusiastic',
      verbosity: 'balanced',
      emojis: 'moderate',
      firstPerson: true,
    },
    behavior: {
      alwaysCite: true,
      suggestFollowUps: true,
      admitUncertainty: true,
      offerElaboration: true,
      greeting: 'warm',
    },
  },
  concise: {
    tone: {
      formality: 'neutral',
      enthusiasm: 'reserved',
      verbosity: 'concise',
      emojis: 'none',
      firstPerson: false,
    },
    behavior: {
      alwaysCite: true,
      suggestFollowUps: false,
      admitUncertainty: true,
      offerElaboration: false,
      greeting: 'none',
    },
  },
  teacher: {
    tone: {
      formality: 'neutral',
      enthusiasm: 'balanced',
      verbosity: 'detailed',
      emojis: 'minimal',
      firstPerson: true,
    },
    behavior: {
      alwaysCite: true,
      suggestFollowUps: true,
      admitUncertainty: true,
      offerElaboration: true,
      greeting: 'warm',
    },
  },
};

export interface NoticeConfig {
  type: 'banner' | 'modal' | 'bottom-sheet' | 'fullscreen' | 'inline';
  title: string;
  content: string;
  primaryAction?: { text: string; onClick: () => void; icon?: string };
  secondaryAction?: { text: string; onClick: () => void };
  dismissible?: boolean;
  showOnce?: boolean;
  position?: 'top' | 'bottom';
  icon?: string;
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

// ─── Re-exports from client modules ──────────────────────────────────────────
export type { NLUResult, QueryType, HighLevelIntent, SearchStrategy } from '../client/intent-engine.js';
export type { SearchMode, SearchResponse } from '../client/search-modes.js';
