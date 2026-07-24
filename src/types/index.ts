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
  
  /**
   * Search bar display mode.
   * 
   * 'overview' — Show concise AI overview in search dropdown (default)
   * 'button'   — Show "Ask AI" button, opens chat panel directly (like Algolia)
   * 'none'     — No AI integration in search bar
   * 
   * @default 'overview'
   */
  mode?: 'overview' | 'button' | 'none';
  
  /**
   * Maximum characters for overview text.
   * @default 400
   */
  overviewMaxLength?: number;
  
  /**
   * Button text for "Ask AI" mode.
   * @default 'Ask AI'
   */
  askAIButtonText?: string;
  
  /**
   * Style of inline answers in search bar (Legacy).
   * 'overview' — Brief summary, no code, no citations (default)
   * 'detailed' — Full answer with code blocks and citations
   */
  answerStyle?: 'overview' | 'detailed';
  
  /**
   * Maximum characters for inline answer (Legacy).
   * @default 300
   */
  maxAnswerLength?: number;
  
  /**
   * Show "Open in Chat" button.
   * @default true
   */
  showExpandButton?: boolean;
  
  /**
   * Show hint text "Press Enter for detailed answer" (Legacy).
   * @default true
   */
  showTransferHint?: boolean;
  
  /**
   * Custom placeholder text.
   * @default 'Ask AI or search docs...'
   */
  placeholder?: string;
  
  /**
   * Custom logo/icon.
   */
  logo?: {
    src?: string;
    icon?: string;
    alt?: string;
  };
  
  /**
   * Keyboard shortcut hint.
   * @default '⌘K'
   */
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

  /**
   * Show "AI may be inaccurate" disclaimer below input.
   * @default true
   */
  showDisclaimer?: boolean;

  /**
   * Custom disclaimer text.
   * @default 'AI may respond inaccurately.'
   */
  disclaimerText?: string;

  /**
   * Custom disclaimer link.
   * @default 'https://depthindex.vercel.app/guide/limitations'
   */
  disclaimerLink?: string;

  /**
   * Custom URL allowing users to report bugs or errors.
   */
  reportUrl?: string;

  /**
   * Custom URL allowing users to submit feedback or suggestions.
   */
  feedbackUrl?: string;
}

export interface FloatingButtonConfig {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: string;
  pulse?: boolean;
  label?: string;
}

import type { SubscriptionConfig } from '../sdk/subscription/types.js';
import type { WebhookConfig } from '../sdk/webhooks/types.js';
import type { BannerConfig } from './banner.js';

export type { SubscriptionConfig, SubscriptionPlan, SubscriptionUser, PlanFeatures } from '../sdk/subscription/types.js';
export type { WebhookConfig, WebhookEvent, WebhookPayload } from '../sdk/webhooks/types.js';
export type { BannerConfig, BannerType, BannerPosition } from './banner.js';

export interface GPUConfig {
  /**
   * Enable GPU acceleration.
   * Auto-detects WebGPU > WebGL > WASM > CPU.
   * @default true
   */
  enabled?: boolean;

  /**
   * Maximum GPU memory to use (MB).
   * @default 256
   */
  maxMemoryMB?: number;

  /**
   * Accelerate vector search operations.
   * @default true
   */
  accelerateSearch?: boolean;

  /**
   * Accelerate embedding generation.
   * @default true
   */
  accelerateEmbeddings?: boolean;

  /**
   * Fallback behavior when GPU unavailable.
   * 'silent' — Use CPU without notice
   * 'warn'   — Log warning
   * 'error'  — Throw error
   * @default 'silent'
   */
  fallback?: 'silent' | 'warn' | 'error';
}

export interface IndexDownloadConfig {
  /**
   * Download strategy for search index.
   * 'full'    — Download entire index on first visit (default, best for small docs)
   * 'lazy'    — Download only pages the user visits or AI needs
   * 'eager'   — Download visited pages + preload related pages
   * 'offline' — Download everything for full offline use
   * @default 'full'
   */
  strategy?: 'full' | 'lazy' | 'eager' | 'offline';

  /**
   * Maximum cached index size (MB).
   * Older chunks are evicted when exceeded.
   * @default 50
   */
  maxCacheSizeMB?: number;

  /**
   * Preload related pages when visiting a page.
   * Only applies to 'eager' strategy.
   * @default 2
   */
  preloadRelatedPages?: number;

  /**
   * Auto-download pages when AI search needs them.
   * @default true
   */
  downloadOnDemand?: boolean;

  /**
   * Remove deleted pages from device on update.
   * CRITICAL for security.
   * @default true
   */
  removeDeletedPages?: boolean;
}

export interface CitationConfig {
  /**
   * Show inline citation badges.
   * @default true
   */
  showInlineCitations?: boolean;

  /**
   * Show references section at bottom of answer.
   * @default false — OFF by default (citations are usually enough)
   */
  showReferencesSection?: boolean;

  /**
   * Citation display style.
   * 'superscript' — ¹²³ (small numbers above text)
   * 'inline'      — [1] [2] [3] (bracketed numbers)
   * 'underline'   — Underlined text links to source
   * @default 'superscript'
   */
  style?: 'superscript' | 'inline' | 'underline';

  /**
   * Maximum citations to show inline.
   * @default 10
   */
  maxInlineCitations?: number;

  /**
   * Show citation count badge.
   * @default false
   */
  showCitationCount?: boolean;
}

export interface ReferenceConfig {
  /**
   * Show references section.
   * @default false — OFF by default
   */
  enabled?: boolean;

  /**
   * Reference display style.
   * 'list'    — Numbered list at bottom
   * 'pills'   — Clickable pill badges
   * 'inline'  — Inline underlined links
   * @default 'list'
   */
  style?: 'list' | 'pills' | 'inline';

  /**
   * Show reference title/heading.
   * @default true
   */
  showTitle?: boolean;

  /**
   * Maximum references to show.
   * @default 10
   */
  maxReferences?: number;

  /**
   * Group references by page.
   * @default false
   */
  groupByPage?: boolean;

  /**
   * Show snippet preview in references.
   * @default false
   */
  showSnippet?: boolean;

  /**
   * Custom reference title.
   * @default 'References'
   */
  title?: string;
}

export interface ExperimentalConfig {
  /**
   * Enable experimental local intelligence engine.
   * @default false — OFF by default
   */
  enabled?: boolean;

  /**
   * Engine mode.
   * 'auto'  — Use best available (transformer > graph > semantic)
   * 'transformer' — Small ONNX transformer model (~15MB)
   * 'graph' — Local knowledge graph + reasoning
   * 'semantic' — Semantic chunking + synthesis (lightest)
   * @default 'auto'
   */
  mode?: 'auto' | 'transformer' | 'graph' | 'semantic';

  /**
   * Model size for transformer mode.
   * 'tiny'  — ~8MB, fastest, lower quality
   * 'small' — ~15MB, balanced
   * 'base'  — ~30MB, best quality (requires more RAM)
   * @default 'small'
   */
  modelSize?: 'tiny' | 'small' | 'base';

  /**
   * Maximum tokens for generated response.
   * @default 512
   */
  maxResponseTokens?: number;

  /**
   * Temperature for generation (0 = deterministic, 1 = creative).
   * @default 0.3
   */
  temperature?: number;

  /**
   * Enable multi-step reasoning.
   * @default true
   */
  enableReasoning?: boolean;

  /**
   * Enable knowledge graph for cross-page connections.
   * @default true
   */
  enableKnowledgeGraph?: boolean;
}

export interface DepthIndexOptions {
  experimental?: ExperimentalConfig;
  gpu?: GPUConfig;
  subscription?: SubscriptionConfig;
  webhooks?: WebhookConfig[];
  banners?: BannerConfig[];
  components?: Record<string, any>;
  design?: {
    cssVariables?: Record<string, string>;
    customCSS?: string;
  };
  indexDownload?: IndexDownloadConfig;
  citations?: CitationConfig;
  references?: ReferenceConfig;
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
    systemContext?: string;
    logo?: {
      src?: string;
      alt?: string;
      size?: 'sm' | 'md' | 'lg';
      position?: 'header' | 'welcome' | 'both';
    };
  };
  usageLimits?: UsageLimitsConfig;
  synthesis?: {
    conversationMemoryDepth?: number;
    memoryInclude?: ('user' | 'assistant')[];
    recencyWeight?: boolean;
    customEntities?: string[];
    followUpDetection?: {
      sensitivity?: 'strict' | 'normal' | 'relaxed';
      customFollowUpPatterns?: string[];
      sessionTimeout?: number;
    };
  };
  search?: {
    conversationBoost?: boolean;
    boostFactor?: number;
    topicAnalysisDepth?: number;
  };
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
