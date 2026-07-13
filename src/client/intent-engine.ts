// src/client/intent-engine.ts

export interface DetectedIntent {
  primary: string;
  sub?: string;
  confidence: number;
  entities: Record<string, string>;
  context: {
    isFollowUp: boolean;
    referencesPrevious: boolean;
    isPageSpecific: boolean;
    requiresCode: boolean;
    requiresConfig: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

export class IntentEngine {
  private conversationMemory: Array<{ query: string; intent: DetectedIntent; timestamp: number }> = [];
  private nlp: any = null;
  
  constructor() {
    this.initNLP();
  }
  
  private async initNLP(): Promise<void> {
    try {
      // Dynamically import compromise — lightweight, no API keys needed
      // @ts-ignore
      const nlpModule = await Function('return import("compromise")')();
      this.nlp = nlpModule.default || nlpModule;
    } catch {
      // Fallback: regex-based intent detection
      console.log('[DepthIndex] NLP library not available, using pattern matching');
    }
  }
  
  /**
   * Detect user intent from query
   */
  detectIntent(query: string, previousMessages?: Array<{ role: string; content: string }>): DetectedIntent {
    const normalized = query.toLowerCase().trim();
    
    // Check if it's a follow-up
    const isFollowUp = this.isFollowUpQuestion(normalized, previousMessages);
    const referencesPrevious = this.referencesPreviousAnswer(normalized, previousMessages);
    const isPageSpecific = this.isPageSpecificQuestion(normalized);
    
    // Detect primary intent
    const primary = this.detectPrimaryIntent(normalized);
    const sub = this.detectSubIntent(normalized, primary);
    
    // Extract entities
    const entities = this.extractEntities(query);
    
    // Determine requirements
    const requiresCode = this.requiresCodeExamples(normalized);
    const requiresConfig = this.requiresConfiguration(normalized);
    const complexity = this.assessComplexity(normalized);
    
    const intent: DetectedIntent = {
      primary,
      sub,
      confidence: this.calculateConfidence(normalized, primary),
      entities,
      context: {
        isFollowUp,
        referencesPrevious,
        isPageSpecific,
        requiresCode,
        requiresConfig,
        complexity,
      },
    };
    
    // Store in memory
    this.conversationMemory.push({
      query,
      intent,
      timestamp: Date.now(),
    });
    
    // Keep only last 10
    if (this.conversationMemory.length > 10) {
      this.conversationMemory.shift();
    }
    
    return intent;
  }
  
  /**
   * Detect primary intent category
   */
  private detectPrimaryIntent(query: string): string {
    const patterns: Record<string, RegExp[]> = {
      // Configuration
      'configure': [
        /\b(config|configuration|configure|setting|option|parameter|env|environment)\b/,
        /^(how|where) (do|can) I (set|change|configure|modify)\b/,
        /\b(config file|.env|.json|.yaml|.toml)\b/,
      ],
      
      // Troubleshooting
      'troubleshoot': [
        /\b(error|bug|issue|problem|fail|crash|broke|broken|not working|doesn't work)\b/,
        /^(why|how come) (is|does|are|can't|won't)\b/,
        /^(fix|resolve|solve|debug|troubleshoot)\b/,
        /\bgetting (an? )?error\b/,
      ],
      
      // Code Examples
      'example': [
        /^(show|give|provide|share|can I see) (me |us |an? )?(example|sample|demo|code)\b/,
        /\b(example|sample|demo|snippet) (of|for|showing)\b/,
        /\bcode (example|sample|snippet)\b/,
      ],
      
      // Comparison
      'compare': [
        /\b(vs|versus|compared? to|difference between|or)\b.+(better|faster|different)/,
        /^(compare|contrast|difference|which is better)\b/,
        /\b(advantages?|disadvantages?|pros?|cons?|benefits?)\b/,
      ],
      
      // Installation
      'install': [
        /\b(install|installation|setup|download|get started|quick ?start)\b/,
        /^how (do|can) I (install|get|download|add)\b/,
        /\b(npm install|yarn add|pnpm add|pip install|cargo add)\b/,
      ],
      
      // Reference
      'reference': [
        /\b(api|endpoint|method|function|class|interface|type|prop|property|parameter|argument)\b/,
        /^(list|show|tell me|what are) (all |the |available )?(api|endpoints?|methods?|functions?|options?|parameters?)\b/,
        /\b(signature|return type|parameters?)\b/,
      ],
      
      // Best Practice
      'best_practice': [
        /\b(best practice|recommendation|should I|is it (good|bad|recommended))\b/,
        /\b(tip|trick|hint|advice|suggestion)\b/,
      ],

      // Learning & Understanding
      'explain': [
        /^(what|who|where|when)\s+(is|are|was|were|does|do)\b/,
        /^(explain|describe|define|tell me about|what does .+ mean)\b/,
        /^can you (explain|clarify|elaborate)\b/,
        /^(meaning|definition) of\b/,
      ],
      
      // How-to & Implementation
      'how_to': [
        /^how\s+(do|can|would|should|to|does)\b/,
        /^(steps?|guide|tutorial|walkthrough|process) (to|for|of)\b/,
        /^(implement|build|create|make|set up|setup)\b/,
        /^what('s| is) the (best|proper|correct|right) way to\b/,
      ],
    };
    
    for (const [intent, regexps] of Object.entries(patterns)) {
      for (const regex of regexps) {
        if (regex.test(query)) return intent;
      }
    }
    
    return 'general';
  }
  
  /**
   * Detect sub-intent for more precise answering
   */
  private detectSubIntent(query: string, primary: string): string | undefined {
    if (primary === 'explain') {
      if (/\b(beginner|simple|basic|new to|first time)\b/i.test(query)) return 'simplified';
      if (/\b(detail|in-depth|deep dive|advanced|technically)\b/i.test(query)) return 'detailed';
      if (/\b(brief|short|quick|summary|tldr)\b/i.test(query)) return 'summary';
    }
    
    if (primary === 'how_to') {
      if (/\b(step|guide|walkthrough)\b/i.test(query)) return 'step_by_step';
      if (/\b(quick|fast|simple|easy)\b/i.test(query)) return 'quick';
      if (/\b(production|deploy|real world)\b/i.test(query)) return 'production';
    }
    
    return undefined;
  }
  
  /**
   * Extract named entities from query
   */
  private extractEntities(query: string): Record<string, string> {
    const entities: Record<string, string> = {};
    
    // Extract technology names
    const techPatterns = [
      /\b(?:vue|react|angular|svelte|next\.?js|nuxt\.?js|node\.?js|typescript|javascript|python|rust|go|docker|kubernetes|aws|gcp|azure)\b/gi,
      /\b(?:vitepress|vuepress|docusaurus|nextra|mkdocs|sphinx|gitbook)\b/gi,
    ];
    
    for (const pattern of techPatterns) {
      const match = query.match(pattern);
      if (match) entities.technology = match[0].toLowerCase();
    }
    
    // Extract file paths
    const fileMatch = query.match(/(?:[\w-]+\/)*[\w-]+\.(?:ts|js|vue|json|yaml|yml|toml|md|css|scss)/);
    if (fileMatch) entities.file = fileMatch[0];
    
    // Extract commands
    const cmdMatch = query.match(/(?:npm|yarn|pnpm|npx|node|git|docker)\s+\w+/);
    if (cmdMatch) entities.command = cmdMatch[0];
    
    return entities;
  }
  
  /**
   * Check if question is a follow-up to previous answer
   */
  private isFollowUpQuestion(
    query: string,
    previousMessages?: Array<{ role: string; content: string }>
  ): boolean {
    if (!previousMessages || previousMessages.length < 2) return false;
    
    const followUpPatterns = [
      /^(and|but|so|then|also|however|therefore|additionally)\b/i,
      /^(what about|how about|tell me more|go on|continue|elaborate)\b/i,
      /^(can you|could you) (explain|show|give|provide) (more|further|in more detail)\b/i,
      /^(why|how come)\b/i,
      /^(is there|are there) (a|any|more|other)\b/i,
      /^what (else|other)\b/i,
    ];
    
    return followUpPatterns.some(p => p.test(query));
  }
  
  /**
   * Check if question references previous answer
   */
  private referencesPreviousAnswer(
    query: string,
    previousMessages?: Array<{ role: string; content: string }>
  ): boolean {
    if (!previousMessages || previousMessages.length < 2) return false;
    
    const anaphoraPatterns = [
      /\b(it|that|this|these|those|them|they|here|there)\b/i,
      /\b(previous|above|last|former|latter)\b/i,
    ];
    
    return anaphoraPatterns.some(p => p.test(query));
  }
  
  private isPageSpecificQuestion(query: string): boolean {
    return /\b(this page|here|current page|summarize this|page summary)\b/.test(query);
  }
  
  private requiresCodeExamples(query: string): boolean {
    return /\b(code|example|snippet|sample|syntax|how to write|write a)\b/.test(query);
  }
  
  private requiresConfiguration(query: string): boolean {
    return /\b(config|configure|settings?|options?|setup|install|peerDependencies)\b/.test(query);
  }
  
  private assessComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 15) return 'complex';
    if (wordCount > 6) return 'moderate';
    return 'simple';
  }
  
  private calculateConfidence(query: string, primary: string): number {
    if (primary === 'general') return 0.5;
    return 0.85;
  }
}
