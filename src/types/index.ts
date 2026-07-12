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
