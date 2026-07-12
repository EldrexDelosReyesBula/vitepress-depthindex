import { tokenizeAndStem } from '../utils/tokenizer.js';

export interface QueryIntent {
  type: 'search' | 'chat' | 'code';
  isQuestion: boolean;
  expandedTokens: string[];
}

const SYNONYMS: Record<string, string[]> = {
  api: ['endpoint', 'interface', 'method', 'function'],
  config: ['configuration', 'settings', 'options', 'setup'],
  install: ['setup', 'installation', 'download', 'start'],
  build: ['compile', 'bundle', 'generate', 'tsup', 'vite'],
  test: ['vitest', 'testing', 'spec', 'unit'],
  error: ['bug', 'issue', 'failed', 'crash', 'exception'],
  auth: ['login', 'security', 'token', 'permission', 'credentials']
};

export function processQuery(query: string): QueryIntent {
  const originalTokens = tokenizeAndStem(query);
  const lowercaseQuery = query.toLowerCase().trim();

  // 1. Detect intent
  let type: 'search' | 'chat' | 'code' = 'search';
  let isQuestion = false;

  // Simple question indicator phrases
  const questionPhrases = [
    'how', 'why', 'what', 'where', 'who', 'when', 'can i', 'is it',
    'explain', 'describe', 'tell me', 'how to', 'how do'
  ];
  
  if (questionPhrases.some(phrase => lowercaseQuery.startsWith(phrase)) || lowercaseQuery.endsWith('?')) {
    isQuestion = true;
    type = 'chat';
  }

  // Code request indicator phrases
  const codePhrases = [
    'code', 'example', 'snippet', 'syntax', 'function', 'class', 'write a', 'show me'
  ];
  if (codePhrases.some(phrase => lowercaseQuery.includes(phrase))) {
    type = 'code';
  }

  // 2. Query expansion
  const expandedTokensSet = new Set<string>(originalTokens);
  originalTokens.forEach(token => {
    // If we have synonym matches for this stem
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach(syn => {
        // Stem the synonym and add
        const synStems = tokenizeAndStem(syn);
        synStems.forEach(s => expandedTokensSet.add(s));
      });
    }
  });

  return {
    type,
    isQuestion,
    expandedTokens: Array.from(expandedTokensSet)
  };
}
