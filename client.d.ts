declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'remove-stopwords' {
  export function removeStopwords(tokens: string[], stopwords?: string[]): string[];
}

declare module 'stemmer' {
  export function stemmer(word: string): string;
}
