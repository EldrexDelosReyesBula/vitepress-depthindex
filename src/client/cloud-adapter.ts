import { PIIDetector } from './pii-detector.js';
import { SecurityManager } from './security.js';
import { SearchResult } from '../types/index.js';

export interface CloudAdapterOptions {
  provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
  endpoint?: string;
  model?: string;
  apiKey?: string;
}

export interface CloudAIRequest {
  provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
  apiKey: string;
  model: string;
  endpoint?: string;
  messages: Array<{ role: string; content: string }>;
  options?: {
    maxTokens?: number;
    temperature?: number;
    scopeToDocs?: boolean;
  };
}

export interface CloudAIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
}

export async function queryCloudAPI(
  query: string,
  searchResults: SearchResult[],
  options: CloudAdapterOptions
): Promise<string> {
  const adapter = new CloudAdapter();
  const provider = options.provider;
  const apiKey = (typeof window !== 'undefined' 
    ? window.localStorage.getItem(`depthindex_api_key_${provider}`) 
    : null) || options.apiKey || '';

  const docContext = searchResults
    .map((r, idx) => `[Source ${idx + 1}: ${r.chunk.pageTitle} > ${r.chunk.heading}]\n${r.chunk.content}`)
    .join('\n\n');

  const res = await adapter.query(query, {
    provider: provider,
    apiKey: apiKey,
    model: options.model || '',
    endpoint: options.endpoint,
    messages: []
  }, docContext);

  return res.content;
}

export class CloudAdapter {
  private piiDetector = new PIIDetector();
  private securityManager = new SecurityManager();
  private documentationContext: string = '';
  
  private tokenLimits: Record<string, { default: number; models: Record<string, number> }> = {
    openai: { default: 4096, models: { 'gpt-4o': 128000, 'gpt-4o-mini': 128000, 'gpt-3.5-turbo': 16385 } },
    gemini: { default: 8192, models: { 'gemini-1.5-pro': 1048576, 'gemini-1.5-flash': 1048576 } },
    anthropic: { default: 4096, models: { 'claude-3-opus': 200000, 'claude-3-sonnet': 200000, 'claude-3-haiku': 200000 } },
  };

  private validateConfig(config: CloudAIRequest): { valid: boolean; error?: string } {
    if (!config.apiKey && config.provider !== 'custom') {
      return { valid: false, error: `API key for ${config.provider} is missing.` };
    }
    if (config.provider === 'custom' && !config.endpoint) {
      return { valid: false, error: 'Custom provider requires endpoint URL in configuration.' };
    }
    return { valid: true };
  }
  
  private getSystemPrompt(scopeToDocs: boolean, docContext: string): string {
    if (scopeToDocs) {
      return `You are a documentation assistant. You MUST ONLY answer based on the provided documentation content. 

RULES:
1. ONLY use information from the documentation provided below
2. If the answer is NOT in the documentation, respond with: "This topic is not covered in the current documentation. However, here are related topics that might help: [suggest 2-3 related topics from the docs]"
3. NEVER provide information from outside the documentation
4. NEVER guess or make up information
5. NEVER share personal opinions
6. If asked about non-documentation topics, politely redirect to documentation topics
7. Do NOT process, store, or repeat any PII that may appear in queries
8. All responses must be helpful but limited to the documentation scope

DOCUMENTATION CONTENT:
${docContext.substring(0, 100000)}`;
    }
    
    return `You are a documentation assistant. Prioritize information from the documentation when available. If information is not available, clearly state that and suggest related documentation topics. Do not process or store PII.`;
  }
  
  private sanitizeMessages(messages: Array<{ role: string; content: string }>): {
    sanitized: Array<{ role: string; content: string }>;
    piiFound: boolean;
    piiReport: any;
  } {
    const sanitized = messages.map(msg => {
      const { sanitized: cleanContent, wasSanitized } = this.piiDetector.sanitizePII(msg.content);
      
      if (wasSanitized) {
        console.warn('[DepthIndex] PII detected and sanitized in message:', 
          this.piiDetector.auditPII(msg.content).categories);
      }
      
      return { ...msg, content: cleanContent };
    });
    
    const allPII = messages.map(m => this.piiDetector.auditPII(m.content));
    const piiFound = allPII.some(a => a.containsPII);
    
    return {
      sanitized,
      piiFound,
      piiReport: allPII,
    };
  }
  
  async query(
    userQuery: string,
    config: CloudAIRequest,
    documentationContext?: string
  ): Promise<CloudAIResponse> {
    const startTime = performance.now();
    
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (!this.securityManager.checkCloudApiRateLimit()) {
      throw new Error('Cloud API rate limit exceeded. Please wait before sending more requests.');
    }
    
    const piiAudit = this.piiDetector.auditPII(userQuery);
    if (piiAudit.containsPII) {
      console.warn('[DepthIndex] PII detected in query. Categories:', piiAudit.categories);
      userQuery = piiAudit.sanitized;
    }
    
    const docContext = documentationContext || this.documentationContext;
    
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt(
          config.options?.scopeToDocs ?? true,
          docContext
        ),
      },
      {
        role: 'user',
        content: userQuery,
      },
    ];
    
    const { sanitized: sanitizedMessages, piiFound } = this.sanitizeMessages(messages);
    
    if (piiFound) {
      console.warn('[DepthIndex] PII was sanitized before sending to cloud AI');
    }
    
    const tokenEstimate = this.estimateTokens(sanitizedMessages);
    const tokenLimit = this.getTokenLimit(config.provider, config.model);
    
    if (tokenEstimate > tokenLimit * 0.9) {
      console.warn(`[DepthIndex] Token estimate (${tokenEstimate}) near limit (${tokenLimit}). Optimizing...`);
      sanitizedMessages[0].content = this.truncateContext(
        sanitizedMessages[0].content,
        tokenLimit - 500
      );
    }
    
    let response: CloudAIResponse;
    
    switch (config.provider) {
      case 'openai':
        response = await this.queryOpenAI(sanitizedMessages, config);
        break;
      case 'gemini':
        response = await this.queryGemini(sanitizedMessages, config);
        break;
      case 'anthropic':
        response = await this.queryAnthropic(sanitizedMessages, config);
        break;
      case 'custom':
        response = await this.queryCustom(sanitizedMessages, config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
    
    response.content = this.postProcessResponse(response.content, docContext);
    
    this.logUsageMetrics(config.provider, config.model, response.usage);
    
    response.latency = Math.round(performance.now() - startTime);
    
    return response;
  }
  
  private estimateTokens(messages: Array<{ role: string; content: string }>): number {
    let totalChars = 0;
    for (const msg of messages) {
      totalChars += msg.content.length;
    }
    return Math.ceil(totalChars / 4);
  }
  
  private getTokenLimit(provider: string, model: string): number {
    const providerLimits = this.tokenLimits[provider];
    if (!providerLimits) return 4096;
    
    return providerLimits.models[model] || providerLimits.default;
  }
  
  private truncateContext(context: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (context.length <= maxChars) return context;
    
    const keepStart = Math.floor(maxChars * 0.7);
    const keepEnd = Math.floor(maxChars * 0.3);
    
    return context.substring(0, keepStart) + 
           '\n\n[...content truncated to fit token limits...]\n\n' +
           context.substring(context.length - keepEnd);
  }
  
  private postProcessResponse(response: string, docContext: string): string {
    const externalIndicators = [
      /according to (my|our) (knowledge|training|data)/i,
      /based on (my|our) (knowledge|understanding)/i,
      /I (think|believe|suggest|recommend)/i,
      /in my opinion/i,
    ];
    
    let processed = response;
    
    for (const pattern of externalIndicators) {
      processed = processed.replace(pattern, 'Based on the documentation,');
    }
    
    if (processed.includes('not covered') || processed.includes('not found')) {
      const relatedTopics = this.findRelatedTopics(docContext, processed);
      if (relatedTopics.length > 0) {
        processed += '\n\n📚 **Related topics you might find helpful:**\n';
        processed += relatedTopics.map(t => `• ${t}`).join('\n');
      }
    }
    
    return processed;
  }
  
  private findRelatedTopics(docContext: string, query: string): string[] {
    const topics: string[] = [];
    const headingPattern = /^#{1,3}\s+(.+)$/gm;
    let match;
    const headings: string[] = [];
    
    while ((match = headingPattern.exec(docContext)) !== null) {
      headings.push(match[1].trim());
    }
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    for (const heading of headings) {
      const headingLower = heading.toLowerCase();
      const matchCount = queryWords.filter(w => headingLower.includes(w)).length;
      
      if (matchCount >= 1 && !topics.includes(heading)) {
        topics.push(heading);
      }
      
      if (topics.length >= 5) break;
    }
    
    return topics;
  }
  
  private logUsageMetrics(provider: string, model: string, usage: any): void {
    const metrics = {
      timestamp: new Date().toISOString(),
      provider,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    };
    
    if (typeof window !== 'undefined' && window.localStorage) {
      if (window.localStorage.getItem('depthindex-usage-logging') === 'enabled') {
        const logs = JSON.parse(window.localStorage.getItem('depthindex-usage-logs') || '[]');
        logs.push(metrics);
        window.localStorage.setItem('depthindex-usage-logs', JSON.stringify(logs.slice(-100)));
      }
    }
  }
  
  async queryWithFallback(
    query: string,
    cloudConfig: CloudAIRequest,
    offlineEngine: any
  ): Promise<{ content: string; source: 'cloud' | 'offline' }> {
    try {
      const response = await this.query(query, cloudConfig);
      return { content: response.content, source: 'cloud' };
    } catch (error: any) {
      console.warn('[DepthIndex] Cloud query failed, falling back to offline:', error.message);
      
      const offlineResults = await offlineEngine.search(query);
      const content = this.formatOfflineResults(offlineResults);
      
      return { content, source: 'offline' };
    }
  }
  
  private formatOfflineResults(results: any[]): string {
    if (results.length === 0) {
      return `⚠️ This topic is not covered in the current documentation. The documentation may not include information on this specific topic.\n\nHere are some suggestions:\n• Try rephrasing your question\n• Browse the documentation navigation for related topics\n• Check if the topic might be covered in a different section`;
    }
    
    let response = `📚 *Response from offline documentation search (cloud AI unavailable):*\n\n`;
    
    for (const result of results.slice(0, 3)) {
      response += `**${result.page.title}**\n${result.snippet}\n[View section →](${result.page.url})\n\n`;
    }
    
    return response;
  }
  
  private async queryOpenAI(messages: any[], config: CloudAIRequest): Promise<CloudAIResponse> {
    const url = config.endpoint || 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages,
        max_tokens: config.options?.maxTokens || 1000,
        temperature: config.options?.temperature || 0.3,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      latency: 0,
    };
  }
  
  private async queryGemini(messages: any[], config: CloudAIRequest): Promise<CloudAIResponse> {
    const model = config.model || 'gemini-1.5-flash';
    const url = config.endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: config.options?.maxTokens || 1000,
          temperature: config.options?.temperature || 0.3,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      latency: 0,
    };
  }
  
  private async queryAnthropic(messages: any[], config: CloudAIRequest): Promise<CloudAIResponse> {
    const url = config.endpoint || 'https://api.anthropic.com/v1/messages';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens: config.options?.maxTokens || 1000,
        temperature: config.options?.temperature || 0.3,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.content[0].text,
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      latency: 0,
    };
  }
  
  private async queryCustom(messages: any[], config: CloudAIRequest): Promise<CloudAIResponse> {
    if (!config.endpoint) {
      throw new Error('Custom provider endpoint must be configured.');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices?.[0]?.message?.content || 
               data.candidates?.[0]?.content?.parts?.[0]?.text || 
               data.content || 
               data.response || 
               JSON.stringify(data),
      model: 'custom',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      latency: 0,
    };
  }

  async testConnection(options: {
    provider: string;
    apiKey: string;
    model: string;
    endpoint?: string;
  }): Promise<{ model: string; latency: number }> {
    const startTime = performance.now();
    await queryCloudAPI("Say 'Connection verified'.", [], {
      provider: options.provider as any,
      apiKey: options.apiKey,
      model: options.model,
      endpoint: options.endpoint
    });
    const endTime = performance.now();
    return {
      model: options.model,
      latency: Math.round(endTime - startTime)
    };
  }
}
