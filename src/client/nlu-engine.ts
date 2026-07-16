import { NLUResult, QueryType, HighLevelIntent, SearchStrategy } from './intent-engine.js';

export class NLUEngine {
  /**
   * Understand complex natural language queries
   */
  understand(query: string): NLUResult {
    const normalized = query.trim();
    
    // Detect query type
    const type = this.detectQueryType(normalized);
    
    // Extract intent
    const intent = this.detectIntent(normalized);
    
    // Extract entities
    const entities = this.extractEntities(normalized);
    
    // Detect complexity
    const complexity = this.assessComplexity(normalized);
    
    // Detect if multi-part question
    const subQuestions = this.splitMultiPart(normalized);
    
    // Determine best search strategy
    const strategy = this.determineStrategy(type, complexity, subQuestions.length > 1);
    
    return {
      original: query,
      normalized,
      type,
      intent,
      entities,
      complexity,
      subQuestions,
      strategy,
      confidence: this.calculateConfidence(type, entities),
    };
  }
  
  /**
   * Detect question type
   */
  private detectQueryType(query: string): QueryType {
    const q = query.toLowerCase().trim();
    
    if (/^(what|who|where|when)\s+(is|are|was|were|does|do)\b/.test(q)) return 'definition';
    if (/^how\s+(do|can|would|should|to|does|did)\b/.test(q)) return 'how_to';
    if (/^(why|how come)\b/.test(q)) return 'explanation';
    if (/^(show|give|provide|list|tell|find)\s+(me|us)\b/.test(q)) return 'request';
    if (/\b(vs|versus|compare|difference|or)\b.*\b(better|faster|different|best)\b/.test(q)) return 'comparison';
    if (/\b(error|bug|issue|problem|fail|crash|broke|not working|doesn.t work)\b/.test(q)) return 'troubleshoot';
    if (/\b(example|sample|demo|snippet|code)\b/.test(q)) return 'example';
    if (/^(yes|no|can|could|would|will|is|are|does|do|should|shall)\b/.test(q)) return 'yes_no';
    if (/^(summarize|summary|tldr|overview|recap)\b/.test(q)) return 'summary';
    
    return 'general';
  }
  
  /**
   * Detect intent with higher accuracy
   */
  private detectIntent(query: string): HighLevelIntent {
    const q = query.toLowerCase().trim();
    
    const intents: Array<{ intent: HighLevelIntent; patterns: RegExp[]; weight: number }> = [
      {
        intent: 'learn',
        patterns: [
          /\b(learn|understand|know|tell me about|explain|describe|what is|who is)\b/,
          /\b(getting started|beginner|new to|first time|basics?|fundamentals?)\b/,
        ],
        weight: 0.8,
      },
      {
        intent: 'implement',
        patterns: [
          /\b(implement|build|create|make|develop|code|write|program)\b/,
          /\b(how (do|can|to)|steps?|guide|tutorial|walkthrough)\b/,
        ],
        weight: 0.9,
      },
      {
        intent: 'configure',
        patterns: [
          /\b(config|configuration|configure|setting|option|parameter|env|environment)\b/,
          /\b(set up|setup|install|deploy|publish)\b/,
        ],
        weight: 0.85,
      },
      {
        intent: 'fix',
        patterns: [
          /\b(fix|resolve|solve|debug|troubleshoot|workaround)\b/,
          /\b(error|bug|issue|problem|fail|crash|broke|exception)\b/,
        ],
        weight: 0.9,
      },
      {
        intent: 'reference',
        patterns: [
          /\b(api|endpoint|method|function|class|interface|type|prop|property|parameter|argument|return|signature)\b/,
          /\b(list|show|tell me|what are) (all |the |available )?(api|endpoints?|methods?|functions?|options?|parameters?)\b/,
        ],
        weight: 0.85,
      },
      {
        intent: 'chat',
        patterns: [
          /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/,
          /^(thanks|thank you|appreciate|bye|goodbye|see you)\b/,
          /^(who are you|what are you|what can you do|how do you work)\b/,
        ],
        weight: 0.95,
      },
    ];
    
    let bestIntent: HighLevelIntent = 'general';
    let bestScore = 0;
    
    for (const { intent, patterns, weight } of intents) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(q)) score++;
      }
      
      const weightedScore = (score / patterns.length) * weight;
      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestIntent = intent;
      }
    }
    
    return bestIntent;
  }
  
  /**
   * Determine search strategy
   */
  private determineStrategy(
    type: QueryType,
    complexity: 'simple' | 'moderate' | 'complex',
    isMultiPart: boolean
  ): SearchStrategy {
    // Complex or multi-part → prefer cloud
    if (complexity === 'complex' || isMultiPart) {
      return 'cloud_preferred';
    }
    
    // Simple definition → local is fine
    if (type === 'definition' || type === 'yes_no') {
      return 'local_preferred';
    }
    
    // How-to with code → hybrid
    if (type === 'how_to' || type === 'example') {
      return 'hybrid';
    }
    
    return 'auto';
  }
  
  /**
   * Split multi-part questions
   */
  private splitMultiPart(query: string): string[] {
    // Split on common separators
    const parts = query.split(/\s+(?:and|or|also|additionally|furthermore|plus|as well as)\s+/i);
    
    if (parts.length <= 1) {
      // Try splitting on numbered items
      const numbered = query.split(/\s+(?:\d+[.)]\s*)/);
      if (numbered.length > 1) return numbered.filter(p => p.trim().length > 5);
    }
    
    return parts.filter(p => p.trim().length > 5);
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
  
  private assessComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 15) return 'complex';
    if (wordCount > 6) return 'moderate';
    return 'simple';
  }
  
  private calculateConfidence(type: QueryType, entities: Record<string, string>): number {
    let confidence = 0.5;
    if (type !== 'general') confidence += 0.2;
    if (Object.keys(entities).length > 0) confidence += 0.15;
    return Math.min(confidence, 0.95);
  }
}
