// src/client/suggestion-engine.ts
import { SiteProfile, PageContext } from '../types/index.js';

export interface SuggestionContext {
  siteProfile: SiteProfile;
  currentPage: PageContext;
  conversationHistory: Array<{ role: string; content: string; id?: string }>;
  userIntent?: string;
}

interface SidebarItem {
  header: string;
  subItems: string[];
  totalItems: number;
}

export class SuggestionEngine {
  private suggestionCache: Map<string, string[]> = new Map();

  /**
   * Generate smart, context-aware suggestions.
   * NEVER suggests topics that do not exist in the docs.
   */
  generate(context: SuggestionContext, count: number = 4): string[] {
    const cacheKey = this.buildCacheKey(context);
    const cached = this.suggestionCache.get(cacheKey);
    if (cached) return cached.slice(0, count);

    const suggestions = new Set<string>();
    const profile = context.siteProfile;

    // Tier 1: Page-specific (highest priority)
    const page = context.currentPage as any;
    if (page.title) {
      const contentLength = page.contentLength ?? 999;
      if (contentLength > 200) {
        suggestions.add('Summarize this page');
        suggestions.add('What are the key takeaways from this page?');
      }
      if (page.hasCodeBlocks) {
        suggestions.add('Explain the code examples on this page');
      }
      if (page.hasConfig) {
        suggestions.add(`How do I configure ${page.title.toLowerCase()}?`);
      }
    }

    // Tier 2: From sidebar structure (verified content)
    const sidebarItems = this.extractSidebarItems();
    const verifiedTopics = this.extractVerifiedTopics(sidebarItems);

    if (verifiedTopics.length > 0) {
      const gettingStarted = verifiedTopics.find(t =>
        t.toLowerCase().includes('start') ||
        t.toLowerCase().includes('install') ||
        t.toLowerCase().includes('quick')
      );
      if (gettingStarted) {
        suggestions.add(`How do I ${gettingStarted.toLowerCase()}?`);
      }
      if (verifiedTopics.some(t => t.toLowerCase().includes('feature'))) {
        suggestions.add(`What are the main features of ${profile.name}?`);
      }
      const mainTopic = verifiedTopics[0];
      if (mainTopic && mainTopic.length > 3) {
        suggestions.add(`Tell me about ${mainTopic.toLowerCase()}`);
      }
    }

    // Tier 3: Type-specific (only if verified in sidebar)
    const hasAPI = verifiedTopics.some(t =>
      t.toLowerCase().includes('api') || t.toLowerCase().includes('endpoint') || t.toLowerCase().includes('reference')
    );
    const hasConfig = verifiedTopics.some(t =>
      t.toLowerCase().includes('config') || t.toLowerCase().includes('option') || t.toLowerCase().includes('setting')
    );
    const hasGuide = verifiedTopics.some(t =>
      t.toLowerCase().includes('guide') || t.toLowerCase().includes('tutorial') || t.toLowerCase().includes('example')
    );

    if (hasAPI) {
      suggestions.add('How do I authenticate with the API?');
      suggestions.add('Show me an API request example');
    }
    if (hasConfig) suggestions.add('What configuration options are available?');
    if (hasGuide) suggestions.add('Walk me through a complete example');

    // Tier 4: Contextual follow-ups
    if (context.conversationHistory.length > 0) {
      const lastAnswer = [...context.conversationHistory].reverse().find(m => m.role === 'assistant');
      if (lastAnswer) {
        this.generateFollowUps(lastAnswer.content, verifiedTopics).forEach(f => suggestions.add(f));
      }
    }

    // Tier 5: Universal safe suggestions
    const safeDefaults = [`What is ${profile.name}?`, 'How do I get started?'];
    for (const def of safeDefaults) {
      if (suggestions.size < count) suggestions.add(def);
    }

    // Final filtering
    const result = Array.from(suggestions)
      .filter(s => this.isValidSuggestion(s, verifiedTopics, profile))
      .slice(0, count);

    this.suggestionCache.set(cacheKey, result);
    return result;
  }

  private extractSidebarItems(): SidebarItem[] {
    const items: SidebarItem[] = [];
    if (typeof document === 'undefined') return items;

    document.querySelectorAll('.VPSidebarItem').forEach(group => {
      const headerEl = group.querySelector(':scope > .text, :scope > .item > .text');
      const header = headerEl?.textContent?.trim() || '';
      const subItems: string[] = [];
      group.querySelectorAll('.VPLink').forEach(link => {
        const text = link.querySelector('.text')?.textContent?.trim();
        const href = link.getAttribute('href');
        if (text && href) subItems.push(text);
      });
      if (header || subItems.length > 0) {
        items.push({ header, subItems, totalItems: subItems.length });
      }
    });

    return items;
  }

  private extractVerifiedTopics(items: SidebarItem[]): string[] {
    const topics: string[] = [];
    for (const item of items) {
      if (item.header) topics.push(item.header);
      topics.push(...item.subItems);
    }
    return [...new Set(topics)];
  }

  private isValidSuggestion(suggestion: string, verifiedTopics: string[], profile: SiteProfile): boolean {
    const normalized = suggestion
      .replace(/^(how|what|why|when|where|who|can|could|would|will|do|does|is|are|show|tell|explain|describe)\s+(do|does|is|are|can|could|would|will|me|us|you|i|the|a|an)?\s*/i, '')
      .replace(/\?$/, '')
      .toLowerCase()
      .trim();

    const hasMatch = verifiedTopics.some(topic => {
      const topicLower = topic.toLowerCase();
      if (normalized.includes(topicLower)) return true;
      const words = normalized.split(/\s+/).filter(w => w.length > 3);
      return words.some(word => topicLower.includes(word));
    });

    if (hasMatch) return true;
    if (normalized.includes(profile.name.toLowerCase())) return true;

    const universals = ['get started', 'features', 'example', 'install', 'configure', 'setup', 'overview', 'summary'];
    if (universals.some(q => normalized.includes(q))) {
      return verifiedTopics.some(t => universals.some(q => t.toLowerCase().includes(q)));
    }

    // No sidebar data — allow through
    if (verifiedTopics.length === 0) return true;

    return false;
  }

  private generateFollowUps(answerContent: string, verifiedTopics: string[]): string[] {
    const followUps: string[] = [];
    for (const topic of verifiedTopics) {
      if (answerContent.toLowerCase().includes(topic.toLowerCase())) {
        followUps.push(`Tell me more about ${topic.toLowerCase()}`);
      }
    }
    if (answerContent.includes('```')) followUps.push('Explain the code in more detail');
    if (/\b(config|configuration|setting|option|parameter)\b/i.test(answerContent)) {
      followUps.push('Show me all available configuration options');
    }
    return followUps.slice(0, 3);
  }

  private buildCacheKey(context: SuggestionContext): string {
    return `${context.currentPage.title}_${context.conversationHistory.length}_${context.siteProfile.type}`;
  }

  /** Invalidate cache on page navigation */
  invalidate(): void {
    this.suggestionCache.clear();
  }
}
