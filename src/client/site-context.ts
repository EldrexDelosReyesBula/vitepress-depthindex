// src/client/site-context.ts

export interface SiteProfile {
  name: string;
  description: string;
  type: 'library' | 'framework' | 'tool' | 'api' | 'guide' | 'tutorial' | 'product' | 'unknown';
  topics: string[];
  mainFeatures: string[];
  targetAudience: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  detectedFrom: {
    title: boolean;
    description: boolean;
    headings: boolean;
    content: boolean;
  };
}

export class SiteContextEngine {
  private profile: SiteProfile | null = null;
  
  /**
   * Auto-detect everything about the site from DOM alone.
   * Zero configuration required from developers.
   */
  detectSiteProfile(): SiteProfile {
    if (this.profile) return this.profile;
    
    if (typeof document === 'undefined') {
      return {
        name: 'Documentation',
        description: 'Documentation site',
        type: 'unknown',
        topics: [],
        mainFeatures: [],
        targetAudience: 'technical users',
        complexity: 'intermediate',
        detectedFrom: {
          title: false,
          description: false,
          headings: false,
          content: false,
        },
      };
    }
    
    const title = this.extractSiteTitle();
    const description = this.extractSiteDescription();
    const headings = this.extractAllHeadings();
    const mainContent = this.extractMainContent();
    
    // Detect type
    const type = this.detectSiteType(title, description, headings, mainContent);
    
    // Extract topics
    const topics = this.extractTopics(headings, mainContent);
    
    // Detect features
    const mainFeatures = this.extractFeatures(headings, mainContent);
    
    // Detect audience
    const targetAudience = this.detectAudience(mainContent);
    
    // Detect complexity
    const complexity = this.detectComplexity(mainContent);
    
    this.profile = {
      name: title
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase to spaces
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // ACRONYMS to spaces
        .replace(/\s+/g, ' ')
        .trim(),
      description,
      type,
      topics,
      mainFeatures,
      targetAudience,
      complexity,
      detectedFrom: {
        title: !!title,
        description: !!description,
        headings: headings.length > 0,
        content: mainContent.length > 100,
      },
    };
    
    return this.profile;
  }
  
  /**
   * Extract site title from multiple sources
   */
  private extractSiteTitle(): string {
    if (typeof document === 'undefined') return 'Documentation';
    
    // 1. VitePress frontmatter title
    const h1 = document.querySelector('.VPContent h1, main h1, article h1');
    if (h1?.textContent) return h1.textContent.replace(/\s+/g, ' ').trim();
    
    // 2. Page title
    const titleTag = document.querySelector('title');
    if (titleTag?.textContent) {
      // Remove site name suffix (e.g., "Page | Site Name")
      return titleTag.textContent.split(/\s*[|–—-]\s*/)[0].replace(/\s+/g, ' ').trim();
    }
    
    // 3. Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.getAttribute('content')) {
      return ogTitle.getAttribute('content')!.trim();
    }
    
    // 4. Fallback
    return document.title || 'Documentation';
  }
  
  /**
   * Extract site description
   */
  private extractSiteDescription(): string {
    if (typeof document === 'undefined') return 'Documentation site';
    
    // 1. Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc?.getAttribute('content')) {
      return metaDesc.getAttribute('content')!.trim();
    }
    
    // 2. Open Graph description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc?.getAttribute('content')) {
      return ogDesc.getAttribute('content')!.trim();
    }
    
    // 3. First meaningful paragraph
    const firstP = document.querySelector('.VPContent p, main p, article p');
    if (firstP?.textContent && firstP.textContent.length > 50) {
      return firstP.textContent.trim().substring(0, 160);
    }
    
    return 'Documentation site';
  }
  
  /**
   * Extract all headings for topic analysis
   */
  private extractAllHeadings(): string[] {
    if (typeof document === 'undefined') return [];
    
    const headings: string[] = [];
    const elements = document.querySelectorAll(
      '.VPContent h1, .VPContent h2, .VPContent h3, main h1, main h2, main h3, article h1, article h2, article h3'
    );
    
    elements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 2) headings.push(text);
    });
    
    return headings;
  }
  
  /**
   * Extract main content text
   */
  private extractMainContent(): string {
    if (typeof document === 'undefined') return '';
    const content = document.querySelector('.VPContent, main, article');
    return content?.textContent?.trim() || '';
  }
  
  /**
   * Detect what type of site this is
   */
  private detectSiteType(
    title: string,
    description: string,
    headings: string[],
    content: string
  ): SiteProfile['type'] {
    const combined = `${title} ${description} ${headings.slice(0, 5).join(' ')} ${content.substring(0, 1000)}`.toLowerCase();
    
    const patterns: Record<SiteProfile['type'], RegExp[]> = {
      library: [
        /\b(library|package|module|plugin|npm|install|import)\b/,
        /\bnpm install\b/,
        /\bimport .+ from\b/,
        /\bpeer ?dependenc(y|ies)\b/,
      ],
      framework: [
        /\b(framework|vue|react|angular|svelte|next|nuxt)\b/,
        /\bcreate (app|project)\b/,
        /\bscaffold(ing)?\b/,
        /\bcomponent (library|framework)\b/,
      ],
      tool: [
        /\b(tool|cli|command|utility|generator|builder|compiler)\b/,
        /\bcommand line\b/,
        /\bCLI\b/,
        /\bnpx\b/,
      ],
      api: [
        /\b(api|endpoint|rest|graphql|request|response|auth|token)\b/,
        /\bauthentication\b/,
        /\bPOST\b.*\bGET\b/,
        /\bbearer\b/,
      ],
      guide: [
        /\b(guide|tutorial|documentation|docs|learn|getting.started)\b/,
        /\bstep.by.step\b/,
        /\bhow.to\b/,
        /\bbeginner\b/,
      ],
      tutorial: [
        /\b(tutorial|course|lesson|class|learn|step-by-step)\b/,
        /\bgetting started\b/,
      ],
      product: [
        /\b(product|platform|service|pricing|enterprise|subscription)\b/,
        /\bfree trial\b/,
        /\bcontact sales\b/,
        /\bpricing\b/,
      ],
      unknown: [],
    };
    
    let bestType: SiteProfile['type'] = 'unknown';
    let bestScore = 0;
    
    for (const [type, regexps] of Object.entries(patterns)) {
      let score = 0;
      for (const regex of regexps) {
        if (regex.test(combined)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestType = type as SiteProfile['type'];
      }
    }
    
    return bestType;
  }
  
  /**
   * Extract main topics from headings
   */
  private extractTopics(headings: string[], content: string): string[] {
    const stopWords = new Set([
      'overview', 'introduction', 'getting started', 'installation',
      'guide', 'tutorial', 'reference', 'api', 'examples', 'faq',
      'table of contents', 'index', 'home', 'welcome',
    ]);
    
    const topics = new Set<string>();
    
    // From headings (weighted by level)
    for (const heading of headings) {
      const cleaned = heading.toLowerCase()
        .replace(/[#*`\[\]()]/g, '')
        .trim();
      
      if (cleaned.length > 2 && !stopWords.has(cleaned)) {
        topics.add(this.capitalizeTopic(cleaned));
      }
    }
    
    // From content (keyword extraction)
    const keywords = this.extractKeywords(content);
    for (const keyword of keywords.slice(0, 10)) {
      topics.add(keyword);
    }
    
    return [...topics].slice(0, 15);
  }
  
  /**
   * Extract main features from content
   */
  private extractFeatures(headings: string[], content: string): string[] {
    const features: string[] = [];
    
    // Look for feature lists
    const featurePatterns = [
      /\b(features?|capabilities|key (features|benefits|highlights)|what can (it|you) do)\b/i,
      /\b(supports?|provides?|offers?|includes?|enables?|allows?)\b/,
    ];
    
    // Check headings for feature sections
    for (const heading of headings) {
      if (featurePatterns.some(p => p.test(heading))) {
        // Find the list items after this heading
        const headingEl = this.findHeadingElement(heading);
        if (headingEl) {
          const listItems = headingEl.nextElementSibling?.querySelectorAll('li');
          if (listItems) {
            listItems.forEach(li => {
              const text = li.textContent?.trim();
              if (text && text.length > 10) {
                features.push(text.substring(0, 100));
              }
            });
          }
        }
      }
    }
    
    return features.slice(0, 8);
  }
  
  /**
   * Detect target audience from language complexity
   */
  private detectAudience(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (/\b(beginner|new to|first time|no experience|easy|simple)\b/.test(lowerContent)) {
      return 'beginner-friendly developers';
    }
    if (/\b(advanced|expert|senior|deep dive|under the hood|internals)\b/.test(lowerContent)) {
      return 'experienced developers';
    }
    if (/\b(developer|engineer|coder|programmer|dev)\b/.test(lowerContent)) {
      return 'developers';
    }
    
    return 'technical users';
  }
  
  /**
   * Detect documentation complexity
   */
  private detectComplexity(content: string): SiteProfile['complexity'] {
    const lowerContent = content.toLowerCase();
    
    const advancedTerms = [
      'abstract', 'polymorphism', 'inheritance', 'concurrency',
      'parallel', 'async', 'middleware', 'serialization',
      'protocol', 'algorithm', 'optimization', 'caching',
    ];
    
    const beginnerTerms = [
      'getting started', 'quick start', 'basics', 'introduction',
      'first steps', 'hello world', 'simple', 'easy',
    ];
    
    const advancedCount = advancedTerms.filter(t => lowerContent.includes(t)).length;
    const beginnerCount = beginnerTerms.filter(t => lowerContent.includes(t)).length;
    
    if (advancedCount > 5) return 'advanced';
    if (beginnerCount > 3) return 'beginner';
    return 'intermediate';
  }
  
  generateGreeting(): string {
    const profile = this.detectSiteProfile();
    
    const greetings = [
      `Hello! 👋 I'm your AI assistant for **${profile.name}**. I've read through all the documentation and I'm ready to help. Ask me anything about the docs!`,
      
      `Hi there! Welcome to the **${profile.name}** documentation! I've read the pages and am ready to assist. Ask me anything about these docs. 🎯`,
      
      `Hey! Welcome to the **${profile.name}** documentation! 🎯 I've read through the docs and am ready to help. What would you like to learn today?`,
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  
  /**
   * Generate smart suggested questions based on site content
   */
  generateSuggestedQuestions(count: number = 5): string[] {
    const profile = this.detectSiteProfile();
    const headings = this.extractAllHeadings();
    const questions: string[] = [];

    const headingMap: Record<string, string> = {
      'installation': 'How do I install this?',
      'installing': 'How do I install this?',
      'getting started': 'How do I get started?',
      'quick start': 'How do I get started?',
      'configuration': 'How do I configure this?',
      'usage': 'How do I use this?',
      'examples': 'Show me some examples',
      'prerequisites': 'What are the prerequisites?',
      'requirements': 'What are the prerequisites?',
      'features': 'What are the key features?',
      'key features': 'What are the key features?',
      'limitations': 'What are the limitations of this plugin?',
      'faq': 'What are the frequently asked questions?',
      'troubleshooting': 'How do I troubleshoot common errors?',
    };

    // 1. Generate questions directly from the headings on this page
    for (const heading of headings) {
      const cleanHeading = heading.replace(/^[0-9.#\s]+/, '').trim();
      const lower = cleanHeading.toLowerCase();

      // Skip current site name or headings that are too long
      if (lower === profile.name.toLowerCase() || cleanHeading.length > 50) {
        continue;
      }

      // Check standard mappings
      let mapped = false;
      for (const [key, q] of Object.entries(headingMap)) {
        if (lower === key || lower.includes(` ${key}`) || lower.startsWith(`${key} `)) {
          if (!questions.includes(q)) {
            questions.push(q);
            mapped = true;
            break;
          }
        }
      }
      if (mapped) continue;

      // Wrap heading in a natural question structure
      if (cleanHeading.endsWith('?')) {
        questions.push(cleanHeading);
      } else if (/\b(how|why|what|where|who)\b/i.test(cleanHeading)) {
        questions.push(cleanHeading + '?');
      } else {
        const words = cleanHeading.split(/\s+/).length;
        if (words <= 3) {
          questions.push(`What is ${cleanHeading}?`);
        } else {
          questions.push(`Tell me about ${cleanHeading}`);
        }
      }
    }

    // 2. Fallbacks based on site profile type if not enough headings on page
    if (questions.length < count) {
      const typeFallback: Record<SiteProfile['type'], string[]> = {
        library: [
          'How do I install this?',
          'What are the main features?',
          'Show me a basic example',
          'How do I configure it?',
          'What are the requirements?',
        ],
        framework: [
          'How do I create a new project?',
          'What is the project structure?',
          'How does routing work?',
          'Show me component examples',
          'How do I deploy?',
        ],
        tool: [
          'How do I use the CLI?',
          'What commands are available?',
          'Show me common workflows',
          'How do I configure it?',
          'What can this tool do?',
        ],
        api: [
          'How do I authenticate?',
          'What endpoints are available?',
          'Show me a request example',
          'What are the rate limits?',
          'How do I handle errors?',
        ],
        guide: [
          'What will I learn?',
          'What are the prerequisites?',
          'How long does it take?',
          'Show me the first steps',
          'Is there a quick start?',
        ],
        tutorial: [
          'What is the goal of this tutorial?',
          'Where do I start?',
          'What are the steps involved?',
        ],
        product: [
          'What are the key features of this product?',
          'Is there a free trial?',
          'Where can I find the pricing?',
        ],
        unknown: [
          'What is this project about?',
          'How do I get started?',
          'Show me some examples',
        ],
      };

      const fallbacks = typeFallback[profile.type] || typeFallback.unknown;
      for (const q of fallbacks) {
        if (questions.length >= count) break;
        if (!questions.includes(q)) {
          questions.push(q);
        }
      }
    }

    // De-duplicate case-insensitively
    const uniqueQuestions: string[] = [];
    const seen = new Set<string>();
    for (const q of questions) {
      const key = q.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueQuestions.push(q);
      }
    }

    return uniqueQuestions.slice(0, count);
  }
  
  /**
   * Generate page-specific contextual questions
   */
  generatePageQuestions(): string[] {
    if (typeof document === 'undefined') return [];
    
    const currentHeading = document.querySelector('h1')?.textContent?.trim() || '';
    const currentContent = document.querySelector('.VPContent, main, article')?.textContent?.trim() || '';
    
    const questions: string[] = [
      `Summarize this page`,
      `What are the key takeaways?`,
      `Explain this in simpler terms`,
    ];
    
    // Add questions based on page content
    if (currentContent.includes('```')) {
      questions.push('Explain the code examples');
    }
    if (currentContent.includes('config')) {
      questions.push('Show me configuration options');
    }
    if (/\b(step|guide|tutorial)\b/i.test(currentHeading)) {
      questions.push('Walk me through this step by step');
    }
    
    return questions;
  }
  
  private capitalizeTopic(topic: string): string {
    return topic.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'can', 'could', 'should', 'may', 'might', 'must', 'shall',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
      'for', 'with', 'from', 'about', 'into', 'through', 'during',
      'and', 'but', 'or', 'not', 'no', 'if', 'then', 'else',
      'when', 'where', 'how', 'what', 'which', 'who', 'whom',
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    
    // Count frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
    
    // Sort by frequency
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
      .slice(0, 20);
  }
  
  private findHeadingElement(text: string): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of headings) {
      if (heading.textContent?.trim() === text) {
        return heading as HTMLElement;
      }
    }
    return null;
  }
}
