import { CloudAdapter, CloudAIRequest } from './cloud-adapter.js';

export interface SynthesisStage {
  stage: 'filtering' | 'clustering' | 'extracting' | 'building' | 
         'cloud_processing' | 'finalizing' | 'complete' | 'no_results';
  message: string;
  progress: number; // 0-100
  detail?: string;
}


export interface SearchResult {
  page: {
    url: string;
    title: string;
    section?: string;
  };
  snippet: string;
  score: number;
  fullContent?: string;
  headings?: string[];
  codeBlocks?: Array<{ language: string; code: string; context: string }>;
  configBlocks?: string[];
}

export interface SynthesizedAnswer {
  content: string;
  citations: Citation[];
  confidence: number;
  relatedTopics: Array<{ title: string; url: string }> | string[];
  source: 'local' | 'cloud';
  requestId?: string;
}

export interface Citation {
  index: number;
  url: string;
  title: string;
  section?: string;
  snippet: string;
}

interface SynthesisContext {
  citations: Citation[];
  usedSnippets: Set<string>;
  query: string;
  startTime: number;
  requestId: string;
}

export class AnswerSynthesizer {
  
  async synthesize(
    query: string,
    results: SearchResult[],
    options?: {
      mode?: 'local' | 'cloud';
      cloudAdapter?: CloudAdapter;
      cloudConfig?: CloudAIRequest;
    },
    onProgress?: (stage: SynthesisStage) => void
  ): Promise<SynthesizedAnswer> {
    const MAX_RETRIES = 2;
    let lastError: Error | null = null;
    const ctx: SynthesisContext = {
      citations: [],
      usedSnippets: new Set(),
      query,
      startTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      requestId: this.generateRequestId(),
    };

    let currentOptions = options ? { ...options } : {};
    
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        ctx.citations = [];
        ctx.usedSnippets.clear();

        // Only show progress on first attempt
        const progressCallback = attempt === 1 ? onProgress : undefined;
        
        progressCallback?.({
          stage: 'filtering',
          message: 'Analyzing your question...',
          progress: 10,
        });
        
        const relevant = this.filterRelevant(results, query);
        
        if (relevant.length === 0) {
          progressCallback?.({
            stage: 'no_results',
            message: 'No matching documentation found...',
            progress: 100,
          });
          return this.handleNoResults(query, ctx);
        }
        
        progressCallback?.({
          stage: 'clustering',
          message: 'Organizing information...',
          progress: 25,
          detail: `Found ${relevant.length} relevant sections`,
        });
        
        const clusters = this.clusterResults(relevant);
        
        progressCallback?.({
          stage: 'building',
          message: attempt > 1 ? 'Retrying...' : 'Building response...',
          progress: 60,
        });
        
        let answer: SynthesizedAnswer;
        
        if (currentOptions?.mode === 'cloud' && currentOptions?.cloudAdapter && currentOptions?.cloudConfig) {
          answer = await this.synthesizeWithCloud(query, clusters, {
            cloudAdapter: currentOptions.cloudAdapter,
            cloudConfig: currentOptions.cloudConfig
          }, ctx);
        } else {
          answer = this.synthesizeLocal(query, clusters, ctx);
        }
        
        // Ensure citations are formatted consistently
        answer.content = this.insertCitations(answer.content, answer.citations, ctx.requestId);
        
        return answer;
        
      } catch (error: any) {
        lastError = error;
        
        if (attempt <= MAX_RETRIES) {
          console.log(`[DepthIndex] Synthesis attempt ${attempt} failed, retrying silently...`, error.message);
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
          
          if (currentOptions?.mode === 'cloud') {
            console.log('[DepthIndex] Cloud synthesis failed, falling back to local for retry');
            currentOptions = { ...currentOptions, mode: 'local' };
          }
          
          continue;
        }
        
        console.error('[DepthIndex] All synthesis attempts failed:', lastError);
        
        return {
          content: `I had trouble processing your question after multiple attempts. Please try rephrasing or asking a different question.\n\n<small>If this persists, the documentation may need to be reindexed.</small>`,
          citations: [],
          confidence: 0,
          relatedTopics: [],
          source: 'local',
          requestId: ctx.requestId,
        };
      }
    }
    
    throw lastError || new Error('Unknown synthesis error');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private generateRequestId(): string {
    return `synth_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  private filterRelevant(results: SearchResult[], query: string): SearchResult[] {
    const queryTerms = this.extractKeyTerms(query);
    if (queryTerms.length === 0) return results.slice(0, 8);
    
    return results
      .filter(result => {
        const matchCount = queryTerms.filter(term => 
          result.snippet.toLowerCase().includes(term.toLowerCase()) ||
          result.page.title.toLowerCase().includes(term.toLowerCase())
        ).length;
        
        return matchCount >= 1;
      })
      .slice(0, 8);
  }
  
  private clusterResults(results: SearchResult[]): Map<string, SearchResult[]> {
    const clusters = new Map<string, SearchResult[]>();
    
    for (const result of results) {
      const topic = this.extractMainTopic(result);
      
      if (!clusters.has(topic)) {
        clusters.set(topic, []);
      }
      clusters.get(topic)!.push(result);
    }
    
    return clusters;
  }
  
  private extractMainTopic(result: SearchResult): string {
    if (result.page.section) {
      return result.page.section.toLowerCase()
        .replace(/^(how|what|why|when|where)\s+(to|is|are|do|does)\s+/i, '')
        .trim();
    }
    
    if (result.headings && result.headings.length > 0) {
      return result.headings[0].toLowerCase().trim();
    }
    
    return result.page.title.toLowerCase().trim();
  }
  
  private synthesizeLocal(
    query: string, 
    clusters: Map<string, SearchResult[]>,
    ctx: SynthesisContext
  ): SynthesizedAnswer {
    const intent = this.detectQueryIntent(query);
    let answer = '';
    
    switch (intent) {
      case 'how_to':
        answer = this.buildHowToAnswer(clusters, query, ctx);
        break;
      case 'what_is':
        answer = this.buildWhatIsAnswer(clusters, query, ctx);
        break;
      case 'configuration':
        answer = this.buildConfigurationAnswer(clusters, query, ctx);
        break;
      case 'troubleshooting':
        answer = this.buildTroubleshootingAnswer(clusters, query, ctx);
        break;
      case 'comparison':
        answer = this.buildComparisonAnswer(clusters, query, ctx);
        break;
      default:
        answer = this.buildGeneralAnswer(clusters, query, ctx);
    }
    
    const relatedTopics = this.extractRelatedTopics(clusters, query);
    
    return {
      content: answer,
      citations: ctx.citations,
      confidence: this.calculateConfidence(clusters),
      relatedTopics,
      source: 'local',
      requestId: ctx.requestId,
    };
  }
  
  private async synthesizeWithCloud(
    query: string,
    clusters: Map<string, SearchResult[]>,
    options: { cloudAdapter: CloudAdapter; cloudConfig: CloudAIRequest },
    ctx: SynthesisContext
  ): Promise<SynthesizedAnswer> {
    try {
      const localAnswer = this.synthesizeLocal(query, clusters, ctx);
      const context = this.buildCloudContext(clusters, query);
      const prompt = this.buildCloudPrompt(query, context);
      
      const response = await options.cloudAdapter.query(
        prompt,
        options.cloudConfig,
        context
      );
      
      const contentWithCitations = this.insertCitations(
        response.content,
        ctx.citations,
        ctx.requestId
      );
      
      return {
        content: contentWithCitations,
        citations: [...ctx.citations],
        confidence: 0.9,
        relatedTopics: localAnswer.relatedTopics,
        source: 'cloud',
        requestId: ctx.requestId,
      };
    } catch (error: any) {
      console.log('[DepthIndex] Cloud synthesis failed, using local:', error.message || error);
      return this.synthesizeLocal(query, clusters, ctx);
    }
  }
  
  private buildHowToAnswer(
    clusters: Map<string, SearchResult[]>,
    query: string,
    ctx: SynthesisContext
  ): string {
    let answer = '';
    const allSteps: Array<{ step: string; citationIndex: number }> = [];
    const allCodeBlocks: Array<{ code: string; language: string; context: string; citationIndex: number }> = [];
    
    for (const [topic, results] of clusters) {
      for (const result of results) {
        const steps = this.extractSteps(result, ctx);
        for (const step of steps) {
          const citationIndex = this.addCitation(
            ctx,
            result.page.url,
            result.page.title,
            result.page.section,
            step
          );
          allSteps.push({ step, citationIndex });
        }
        
        if (result.codeBlocks) {
          for (const cb of result.codeBlocks) {
            const citationIndex = this.addCitation(
              ctx,
              result.page.url,
              result.page.title,
              result.page.section,
              `Code: ${cb.language}`
            );
            allCodeBlocks.push({
              code: cb.code,
              language: cb.language,
              context: cb.context,
              citationIndex,
            });
          }
        }
      }
    }
    
    answer += `To ${this.normalizeQueryForAnswer(query)}, follow these steps based on the documentation:\n\n`;
    
    if (allSteps.length > 0) {
      allSteps.forEach(({ step, citationIndex }, index) => {
        answer += `${index + 1}. ${step} [^${citationIndex}]\n`;
      });
      answer += '\n';
    }
    
    if (allCodeBlocks.length > 0) {
      answer += `Here's the code you'll need:\n\n`;
      
      const byLang = new Map<string, typeof allCodeBlocks>();
      for (const cb of allCodeBlocks) {
        if (!byLang.has(cb.language)) byLang.set(cb.language, []);
        byLang.get(cb.language)!.push(cb);
      }
      
      for (const [lang, blocks] of byLang) {
        if (blocks.length === 1) {
          const block = blocks[0];
          answer += `${block.context ? `// ${block.context}\n` : ''}`;
          answer += `\`\`\`${block.language}\n${block.code}\n\`\`\` [^${block.citationIndex}]\n\n`;
        } else {
          answer += `**${lang.toUpperCase()} examples:**\n\n`;
          for (const block of blocks) {
            answer += `${block.context ? `// ${block.context}\n` : ''}`;
            answer += `\`\`\`${block.language}\n${block.code}\n\`\`\` [^${block.citationIndex}]\n\n`;
          }
        }
      }
    }
    
    const totalSources = new Set(ctx.citations.map(c => c.url)).size;
    answer += `---\n*This answer was compiled from ${totalSources} documentation page(s).*\n`;
    
    return answer;
  }
  
  private buildWhatIsAnswer(
    clusters: Map<string, SearchResult[]>,
    query: string,
    ctx: SynthesisContext
  ): string {
    let answer = '';
    const definitions: string[] = [];
    const examples: string[] = [];
    
    for (const [topic, results] of clusters) {
      for (const result of results) {
        const paragraph = this.extractRelevantParagraph(result, query);
        if (paragraph) {
          const citationIndex = this.addCitation(
            ctx,
            result.page.url,
            result.page.title,
            result.page.section,
            paragraph.substring(0, 100)
          );
          
          if (this.isDefinition(paragraph)) {
            definitions.push(`${paragraph} [^${citationIndex}]`);
          } else {
            examples.push(`${paragraph} [^${citationIndex}]`);
          }
        }
      }
    }
    
    if (definitions.length > 0) {
      answer += definitions.join('\n\n') + '\n\n';
    }
    
    if (examples.length > 0) {
      answer += `**Examples from the documentation:**\n\n`;
      examples.forEach((example) => {
        answer += `${example}\n\n`;
      });
    }
    
    if (answer === '') {
      answer = this.buildGeneralAnswer(clusters, query, ctx);
    }
    
    return answer;
  }
  
  private buildConfigurationAnswer(
    clusters: Map<string, SearchResult[]>,
    query: string,
    ctx: SynthesisContext
  ): string {
    let answer = '';
    const configs: Array<{ key: string; value: string; description: string; citationIndex: number }> = [];
    
    for (const [topic, results] of clusters) {
      for (const result of results) {
        const extractedConfigs = this.extractConfigOptions(result);
        for (const config of extractedConfigs) {
          const citationIndex = this.addCitation(
            ctx,
            result.page.url,
            result.page.title,
            result.page.section,
            `Config: ${config.key}`
          );
          configs.push({ ...config, citationIndex });
        }
      }
    }
    
    if (configs.length > 0) {
      answer += `Here are the relevant configuration options:\n\n`;
      
      answer += `| Option | Value | Description |\n`;
      answer += `|--------|-------|-------------|\n`;
      
      for (const config of configs.slice(0, 20)) {
        answer += `| \`${config.key}\` | \`${config.value}\` | ${config.description} [^${config.citationIndex}] |\n`;
      }
      
      answer += '\n';
      
      const fullConfig = this.reconstructConfigBlock(configs);
      if (fullConfig) {
        answer += `**Full configuration example:**\n\n`;
        answer += `\`\`\`yaml\n${fullConfig}\n\`\`\`\n\n`;
      }
    }
    
    return answer || this.buildGeneralAnswer(clusters, query, ctx);
  }
  
  private buildTroubleshootingAnswer(
    clusters: Map<string, SearchResult[]>,
    query: string,
    ctx: SynthesisContext
  ): string {
    let answer = '';
    const solutions: Array<{ problem: string; solution: string; citationIndex: number }> = [];
    
    for (const [topic, results] of clusters) {
      for (const result of results) {
        const extracted = this.extractProblemSolution(result);
        if (extracted) {
          const citationIndex = this.addCitation(
            ctx,
            result.page.url,
            result.page.title,
            result.page.section,
            extracted.problem.substring(0, 100)
          );
          solutions.push({ ...extracted, citationIndex });
        }
      }
    }
    
    if (solutions.length > 0) {
      answer += `Based on the documentation, here are potential solutions:\n\n`;
      
      for (const sol of solutions) {
        answer += `### ${sol.problem}\n\n${sol.solution} [^${sol.citationIndex}]\n\n`;
      }
    }
    
    return answer || this.buildGeneralAnswer(clusters, query, ctx);
  }
  
  private buildComparisonAnswer(
    clusters: Map<string, SearchResult[]>,
    query: string,
    ctx: SynthesisContext
  ): string {
    let answer = "Here's a comparison based on the documentation:\n\n";
    
    const topics = Array.from(clusters.entries());
    
    if (topics.length >= 2) {
      answer += `| Feature | ${topics[0][0]} | ${topics[1][0]} |\n`;
      answer += `|---------|${'-'.repeat(topics[0][0].length + 2)}|${'-'.repeat(topics[1][0].length + 2)}|\n`;
      
      const features = this.extractComparableFeatures(topics);
      for (const feature of features) {
        answer += `| ${feature.name} | ${feature.value1 || '-'} | ${feature.value2 || '-'} |\n`;
      }
      
      answer += '\n';
    }
    
    for (const [topic, results] of topics) {
      const citationIndex = this.addCitation(
        ctx,
        results[0]?.page.url || '#',
        results[0]?.page.title || topic,
        undefined,
        topic
      );
      const summary = results.map(r => r.snippet).join(' ').substring(0, 300);
      answer += `**${topic}**: ${summary}... [^${citationIndex}]\n\n`;
    }
    
    return answer;
  }
  
  private buildGeneralAnswer(
    clusters: Map<string, SearchResult[]>,
    query: string,
    ctx: SynthesisContext
  ): string {
    let answer = '';
    
    const allResults = Array.from(clusters.values()).flat();
    const uniquePages = new Map<string, SearchResult>();
    
    for (const result of allResults) {
      if (!uniquePages.has(result.page.url)) {
        uniquePages.set(result.page.url, result);
      }
    }
    
    if (uniquePages.size === 1) {
      const result = uniquePages.values().next().value!;
      const citationIndex = this.addCitation(
        ctx,
        result.page.url,
        result.page.title,
        result.page.section,
        result.snippet.substring(0, 100)
      );
      
      answer += `According to the documentation page on **${result.page.title}**:\n\n`;
      answer += `${result.snippet} [^${citationIndex}]\n\n`;
      
      if (result.codeBlocks && result.codeBlocks.length > 0) {
        answer += `**Relevant code:**\n\n`;
        for (const cb of result.codeBlocks.slice(0, 3)) {
          answer += `\`\`\`${cb.language}\n${cb.code}\n\`\`\`\n\n`;
        }
      }
    } else {
      answer += `Here's what the documentation says about this topic:\n\n`;
      
      const mainPoints: string[] = [];
      
      for (const [topic, results] of clusters) {
        const combined = results.map(r => r.snippet).join(' ');
        const citationIndex = this.addCitation(
          ctx,
          results[0].page.url,
          results[0].page.title,
          results[0].page.section,
          topic
        );
        
        const point = this.deduplicateText(combined).substring(0, 300);
        mainPoints.push(`• ${point} [^${citationIndex}]`);
      }
      
      answer += mainPoints.join('\n\n') + '\n\n';
    }
    
    const confidence = this.calculateConfidence(clusters);
    if (confidence < 0.6) {
      answer += `> ⚠️ **Note:** The documentation has limited information on this topic. You may want to explore the related topics below or check the full documentation pages.\n\n`;
    }
    
    return answer;
  }
  
  private handleNoResults(query: string, ctx: SynthesisContext): SynthesizedAnswer {
    return {
      content: `I couldn't find specific information about "${query}" in the documentation.\n\n` +
        `**Suggestions:**\n` +
        `• Try rephrasing your question with different keywords\n` +
        `• Browse the documentation navigation for related topics\n` +
        `• Check if the topic might be covered in a different section\n\n` +
        `If you believe this topic should be covered, consider contributing to the documentation!`,
      citations: [],
      confidence: 0,
      relatedTopics: [
        { title: 'Browse the table of contents', url: '/' },
        { title: 'Search with different keywords', url: '#' },
        { title: 'Check the FAQ section', url: '/guide/faq' },
      ],
      source: 'local',
    };
  }
  
  private addCitation(
    ctx: SynthesisContext,
    url: string,
    title: string,
    section?: string,
    snippet?: string
  ): number {
    const existingIndex = ctx.citations.findIndex(
      c => c.url === url && c.section === section
    );
    
    if (existingIndex >= 0) {
      return ctx.citations[existingIndex].index;
    }
    
    const citation: Citation = {
      index: ctx.citations.length + 1,
      url,
      title,
      section,
      snippet: snippet || '',
    };
    
    ctx.citations.push(citation);
    
    return citation.index;
  }
  
  private insertCitations(content: string, citations: Citation[], requestId: string = 'static'): string {
    let processed = content;
    
    // Replace [^1] and [1] style citations with compact single-line HTML
    processed = processed.replace(
      /\[\^?(\d+(?:,\d+)*)\]/g,
      (match, nums) => {
        const indices = nums.split(',').map((n: string) => parseInt(n.trim(), 10));
        
        const parts = indices.map((index: number) => {
          const citation = citations.find(c => c.index === index);
          if (!citation) return match;
          const targetId = `cite-ref-${index}-${requestId}`;
          // Compact single-line — no extra attributes visible in DOM text
          return `<sup><a href="#${targetId}" class="cite" title="${this.escapeAttr(citation.title)}">${index}</a></sup>`;
        });
        
        return parts.join('');
      }
    );
    
    return processed;
  }


  generateReferencesSection(citations: Citation[], requestId?: string): string {
    if (citations.length === 0) return '';
    
    const reqId = requestId || 'static';
    const unique = this.deduplicateCitations(citations);
    
    let refs = '\n\n<div class="references-section">';
    refs += '<h4>References</h4>';
    refs += '<ol class="references-list">';
    
    for (const citation of unique) {
      const targetId = `cite-ref-${citation.index}-${reqId}`;
      const cleanedUrl = this.cleanDocumentationUrl(citation.url);
      
      refs += `<li id="${targetId}" class="reference-item">`;
      refs += `<a href="${this.escapeAttr(cleanedUrl)}" class="ref-link" target="_blank" rel="noopener noreferrer">`;
      refs += `${this.escapeHtml(citation.title)}`;
      refs += `</a>`;
      
      if (citation.section) {
        refs += `<span class="ref-section"> → ${this.escapeHtml(citation.section)}</span>`;
      }
      
      refs += `</li>`;
    }
    
    refs += '</ol>';
    refs += '</div>';
    
    return refs;
  }

  private cleanDocumentationUrl(url: string): string {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    let clean = url.trim();
    
    const hashIdx = clean.indexOf('#');
    let hash = '';
    if (hashIdx !== -1) {
      hash = clean.substring(hashIdx);
      clean = clean.substring(0, hashIdx);
    }
    
    const queryIdx = clean.indexOf('?');
    let query = '';
    if (queryIdx !== -1) {
      query = clean.substring(queryIdx);
      clean = clean.substring(0, queryIdx);
    }
    
    if (clean.endsWith('.md')) {
      clean = clean.substring(0, clean.length - 3);
      const useHtml = typeof window !== 'undefined' && window.location.pathname.includes('.html');
      if (useHtml) {
        clean += '.html';
      }
    }
    
    return clean + query + hash;
  }

  private escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private deduplicateCitations(citations: Citation[]): Citation[] {
    const seen = new Map<string, Citation>();
    
    for (const citation of citations) {
      const key = citation.url + (citation.section || '');
      if (!seen.has(key)) {
        seen.set(key, citation);
      }
    }
    
    return Array.from(seen.values());
  }
  
  private extractSteps(result: SearchResult, ctx: SynthesisContext): string[] {
    const content = result.fullContent || result.snippet;
    const steps: string[] = [];
    
    const numberedPattern = /(?:^|\n)\s*(?:\d+[.)]\s*)(.+?)(?=(?:\n\s*\d+[.)])|$)/gs;
    numberedPattern.lastIndex = 0;
    
    let match;
    
    while ((match = numberedPattern.exec(content)) !== null) {
      const step = match[1].trim();
      if (step.length > 10 && !ctx.usedSnippets.has(step)) {
        steps.push(step);
        ctx.usedSnippets.add(step);
      }
    }
    
    if (steps.length === 0) {
      const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
      const imperativePattern = /^(Install|Configure|Create|Add|Run|Set|Open|Navigate|Click|Enter|Copy|Paste|Execute|Build|Deploy|Start|Enable|Disable|Import|Export)/i;
      
      for (const sentence of sentences) {
        if (imperativePattern.test(sentence) && !ctx.usedSnippets.has(sentence)) {
          steps.push(sentence);
          ctx.usedSnippets.add(sentence);
        }
      }
    }
    
    return steps.slice(0, 10);
  }
  
  private extractRelevantParagraph(result: SearchResult, query: string): string {
    const content = result.fullContent || result.snippet;
    const queryTerms = this.extractKeyTerms(query);
    
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30);
    
    if (paragraphs.length === 0) return content.substring(0, 500);
    
    const scored = paragraphs.map(para => {
      let score = 0;
      const lower = para.toLowerCase();
      
      for (const term of queryTerms) {
        if (lower.includes(term)) score += 2;
      }
      
      if (para.includes('```')) score += 1;
      if (para.includes('**')) score += 1;
      
      return { para, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0]?.para || paragraphs[0];
  }
  
  private extractConfigOptions(result: SearchResult): Array<{
    key: string;
    value: string;
    description: string;
  }> {
    const configs: Array<{ key: string; value: string; description: string }> = [];
    const content = result.fullContent || result.snippet;
    
    const kvPattern = /\b([a-zA-Z_][\w.]*)\s*[:=]\s*(['"][^'"]+['"]|[^\s#]+)(?:\s*#\s*([^.]+?)(?=\s*[a-zA-Z_][\w.]*\s*[:=]|\s*\.|$))?/g;
    kvPattern.lastIndex = 0;
    
    let match;
    
    while ((match = kvPattern.exec(content)) !== null) {
      configs.push({
        key: match[1].trim(),
        value: match[2].trim().replace(/['"]/g, ''),
        description: match[3]?.trim() || '',
      });
    }
    
    return configs;
  }
  
  private extractProblemSolution(result: SearchResult): {
    problem: string;
    solution: string;
  } | null {
    const content = result.fullContent || result.snippet;
    
    const problemPatterns = [
      /(?:If you (?:see|get|encounter|experience)|When|Error:|Problem:)\s*(.+?)(?:[.!?]\s|$)/i,
      /(?:\*\*Error\*\*|__Error__|### Error)\s*:?\s*(.+?)(?:\n|$)/i,
    ];
    
    for (const pattern of problemPatterns) {
      const problemMatch = content.match(pattern);
      if (problemMatch) {
        const afterProblem = content.substring(
          (problemMatch.index || 0) + problemMatch[0].length
        );
        
        const solutionSentences = afterProblem
          .split(/[.!?]+/)
          .filter(s => s.trim().length > 20)
          .slice(0, 3)
          .join('. ');
        
        return {
          problem: problemMatch[1].trim(),
          solution: solutionSentences || 'See the documentation for the solution.',
        };
      }
    }
    
    return null;
  }
  
  private detectQueryIntent(query: string): string {
    const q = query.toLowerCase().trim();
    
    if (/\b(config|configuration|setting|option|parameter|env|environment)\b/i.test(q)) return 'configuration';
    if (/^(how|steps|guide|tutorial|walkthrough)\b/i.test(q)) return 'how_to';
    if (/^(what|who|define|meaning|explain)\b/i.test(q)) return 'what_is';
    if (/\b(error|bug|issue|problem|fail|crash|not working|broke)\b/i.test(q)) return 'troubleshooting';
    if (/\b(vs|versus|compare|difference|or|alternative)\b/i.test(q)) return 'comparison';
    
    return 'general';
  }
  
  private isDefinition(paragraph: string): boolean {
    const definitionPatterns = [
      /^(is|are|refers to|means|defined as|stands for|represents)\b/i,
      /^[A-Z][a-z]+ (is|are) /,
      /^The term /i,
    ];
    
    return definitionPatterns.some(p => p.test(paragraph));
  }
  
  private extractKeyTerms(query: string): string[] {
    const stopWords = new Set([
      'what', 'is', 'the', 'how', 'do', 'i', 'can', 'you', 'a', 'an',
      'of', 'in', 'to', 'for', 'why', 'who', 'where', 'show', 'me',
      'and', 'or', 'but', 'so', 'if', 'then', 'that', 'this', 'it',
      'with', 'from', 'on', 'at', 'by', 'about', 'into', 'through',
      'are', 'was', 'were', 'been', 'available', 'options', 'option',
      'find', 'get', 'explain', 'describe'
    ]);
    
    return query.toLowerCase()
      .split(/[\s,;:.!?()]+/)
      .filter(w => !stopWords.has(w) && w.length > 2);
  }
  
  private normalizeQueryForAnswer(query: string): string {
    return query
      .replace(/^(how|what|why|when|where|who)\s+(do|does|is|are|can|could|would|should|to)\s+(i|we|you|one)\s+/i, '')
      .replace(/^(how|what|why|when|where|who)\s+(do|does|is|are|can|could|would|should|to)\b/i, '')
      .replace(/\s*\?$/, '')
      .trim();
  }
  
  private deduplicateText(text: string): string {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    const seen = new Set<string>();
    const unique: string[] = [];
    
    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(normalized) && sentence.length > 10) {
        seen.add(normalized);
        unique.push(sentence);
      }
    }
    
    return unique.join('. ') + '.';
  }
  
  private calculateConfidence(clusters: Map<string, SearchResult[]>): number {
    const allResults = Array.from(clusters.values()).flat();
    
    if (allResults.length === 0) return 0;
    
    // 1. Source diversity: reward multiple unique source pages
    const uniqueSources = new Set(allResults.map(r => r.page.url)).size;
    const sourceScore = Math.min(uniqueSources / 3, 1) * 0.25;
    
    // 2. Relevance score: average search score across results
    const avgScore = allResults.reduce((sum, r) => sum + (r.score || 0), 0) / allResults.length;
    const relevanceScore = Math.min(avgScore, 1) * 0.35;
    
    // 3. Content richness bonuses
    const hasCode = allResults.some(r => r.codeBlocks && r.codeBlocks.length > 0);
    const hasHeadings = allResults.some(r => r.headings && r.headings.length > 1);
    const hasLongContent = allResults.some(r => ((r.fullContent?.length || 0) + (r.snippet?.length || 0)) > 200);
    const richness = (hasCode ? 0.12 : 0) + (hasHeadings ? 0.10 : 0) + (hasLongContent ? 0.08 : 0);
    
    // 4. Cluster count (multiple topic clusters = more comprehensive answer)
    const clusterBonus = Math.min(clusters.size / 4, 1) * 0.10;
    
    // 5. Base confidence: always give at least 0.30 when we found any results
    const base = allResults.length > 0 ? 0.30 : 0;
    
    const total = base + sourceScore + relevanceScore + richness + clusterBonus;
    
    // Clamp to 0.95 max (never claim 100% confidence)
    return Math.min(Math.round(total * 100), 95) / 100;
  }
  
  private extractRelatedTopics(
    clusters: Map<string, SearchResult[]>,
    query: string
  ): Array<{ title: string; url: string }> {
    const topics: Map<string, string> = new Map(); // topic text -> URL
    const queryTerms = this.extractKeyTerms(query);
    
    for (const [topic, results] of clusters) {
      // Ensure topic key is a string
      const topicStr = typeof topic === 'string' ? topic : String(topic);
      if (topicStr && !queryTerms.some(t => topicStr.toLowerCase().includes(t.toLowerCase()))) {
        const firstResult = results[0];
        if (firstResult) {
          topics.set(topicStr, firstResult.page.url);
        }
      }
      
      for (const result of results) {
        if (result.headings) {
          for (const heading of result.headings) {
            // Coerce heading to string — it might be an object in some index formats
            const headingStr = typeof heading === 'string'
              ? heading
              : (heading as any)?.text || (heading as any)?.title || String(heading);
            const cleaned = String(headingStr).trim();
            if (cleaned && cleaned.length > 2 &&
                !queryTerms.some(t => cleaned.toLowerCase().includes(t.toLowerCase()))) {
              if (!topics.has(cleaned)) {
                topics.set(cleaned, result.page.url);
              }
            }
          }
        }
      }
    }
    
    return Array.from(topics.entries())
      .filter(([title]) => title && title.trim().length > 2)
      .slice(0, 5)
      .map(([title, url]) => ({ title: String(title).trim(), url }));
  }
  
  private buildCloudContext(
    clusters: Map<string, SearchResult[]>,
    query: string
  ): string {
    let context = 'DOCUMENTATION CONTENT:\n\n';
    
    for (const [topic, results] of clusters) {
      context += `## ${topic}\n\n`;
      
      for (const result of results) {
        context += `Source: ${result.page.title}`;
        if (result.page.section) context += ` > ${result.page.section}`;
        context += '\n\n';
        
        context += (result.fullContent || result.snippet).substring(0, 2000);
        context += '\n\n';
        
        if (result.codeBlocks) {
          for (const cb of result.codeBlocks) {
            context += `\`\`\`${cb.language}\n${cb.code}\n\`\`\`\n\n`;
          }
        }
      }
    }
    
    return context.substring(0, 8000);
  }
  
  private buildCloudPrompt(query: string, context: string): string {
    return `You are a documentation assistant. Answer the user's question based ONLY on the documentation content provided below.

USER QUESTION: ${query}

${context}

INSTRUCTIONS:
1. Answer based ONLY on the provided documentation
2. If the information is not in the documentation, say so clearly
3. Synthesize information from multiple sources into a coherent answer
4. Include relevant code examples if available
5. Use numbered citations like [^1], [^2] to reference sources
6. Format your answer in Markdown
7. Suggest related topics at the end if relevant
8. Do NOT make up information or use outside knowledge`;
  }
  
  private reconstructConfigBlock(
    configs: Array<{ key: string; value: string; description: string }>
  ): string {
    if (configs.length === 0) return '';
    
    const lines: string[] = [];
    let currentSection = '';
    
    for (const config of configs) {
      const keyParts = config.key.split('.');
      if (keyParts.length > 1 && keyParts[0] !== currentSection) {
        currentSection = keyParts[0];
        lines.push(`${currentSection}:`);
      }
      
      const indent = keyParts.length > 1 ? '  ' : '';
      const comment = config.description ? `  # ${config.description}` : '';
      lines.push(`${indent}${keyParts[keyParts.length - 1]}: ${config.value}${comment}`);
    }
    
    return lines.join('\n');
  }
  
  private extractComparableFeatures(
    topics: [string, SearchResult[]][]
  ): Array<{ name: string; value1: string; value2: string }> {
    const features: Array<{ name: string; value1: string; value2: string }> = [];
    const seen = new Set<string>();
    
    for (const result of topics[0]?.[1] || []) {
      if (result.headings) {
        for (const heading of result.headings) {
          if (!seen.has(heading)) {
            seen.add(heading);
            features.push({
              name: heading,
              value1: '✓ Supported',
              value2: 'Check docs',
            });
          }
        }
      }
    }
    
    return features.slice(0, 10);
  }
}
