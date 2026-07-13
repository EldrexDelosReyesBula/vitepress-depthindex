import { SiteContextEngine } from './site-context.js';

export class ConversationHandler {
  private intentPatterns: Map<string, RegExp[]>;
  private greetingResponses: string[];

  constructor() {
    this.intentPatterns = new Map([
      ['greeting', [
        /^(hi|hello|hey|greetings|howdy|yo|sup|good (morning|afternoon|evening))/i,
        /^what'?s up/i,
      ]],
      ['farewell', [
        /^(bye|goodbye|see you|cya|ttyl|thanks|thank you)/i,
      ]],
      ['gratitude', [
        /^(thanks|thank you|thx|appreciate it|cheers)/i,
      ]],
      ['identity', [
        /^(who (are you|built you|created you|made you))/i,
        /^(what are you|your name)/i,
      ]],
      ['capability', [
        /^(what (can|do) you (do|help with|offer))/i,
        /^(how (do|can) (I|you) (use|work|search))/i,
      ]],
      ['page_summary', [
        /^(summarize|summary|tldr|overview of) (this|current|the) page/i,
        /^(what'?s (this|the) page about)/i,
      ]],
      ['page_discussion', [
        /^(let'?s discuss|talk about|explain) (this|current|the) page/i,
        /^(tell me more about) (this|current|the) page/i,
      ]],
      ['follow_up', [
        /^(can you (elaborate|explain more|go deeper))/i,
        /^(what (about|if)|how about)/i,
        /^(and|but|so|then|also|however)/i,
      ]],
    ]);

    this.greetingResponses = [
      "👋 Hello! I'm your documentation assistant. I can help you understand any part of these docs. What would you like to know?",
      "Hi there! 🎯 I've indexed every page, code block, and diagram in this documentation. Ask me anything!",
      "Hey! I'm ready to help you navigate these docs. Looking for something specific or want to explore?",
    ];
  }

  detectIntent(query: string): {
    intent: string;
    confidence: number;
    isConversational: boolean;
  } {
    const trimmed = query.trim();
    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          return {
            intent,
            confidence: 0.95,
            isConversational: ['greeting', 'farewell', 'gratitude', 'identity', 'capability'].includes(intent),
          };
        }
      }
    }

    return {
      intent: 'search',
      confidence: 0.8,
      isConversational: false,
    };
  }

  async handleConversational(intent: string, context?: any): Promise<string> {
    switch (intent) {
      case 'greeting':
        return new SiteContextEngine().generateGreeting();

      case 'identity':
        return `I'm **DepthIndex Assistant**, an on-device AI built into this documentation. I run entirely in your browser — no data leaves your device unless configured for cloud AI. You can verify this in the settings.`;

      case 'capability':
        return `Here's what I can do:\n\n🔍 **Deep Search** — I've indexed every page, heading, code block, and diagram\n📊 **Code & Math** — I understand syntax-highlighted code and LaTeX formulas\n📈 **Mermaid Diagrams** — I can render and explain diagrams in the docs\n📄 **Page Awareness** — I know which page you're on and can summarize or discuss it\n💬 **Natural Chat** — Ask follow-ups, say hello, or dive deep\n🔗 **Source Citations** — Every answer links back to the exact docs section\n\nJust ask naturally — I'll find the most relevant information!`;

      case 'gratitude':
        return "You're welcome! 😊 Is there anything else I can help you find in the documentation?";

      case 'farewell':
        return "Goodbye! 👋 Feel free to come back anytime you have questions. I'll be here!";

      default:
        return "I'm not sure how to respond to that, but I'd be happy to help you search the documentation! What are you looking for?";
    }
  }

  handleFollowUp(previousQuery: string, previousResults: any[], followUp: string): {
    refinedQuery: string;
    contextFilter?: string;
  } {
    // Extract key terms from previous query
    const prevTerms = this.extractKeyTerms(previousQuery);

    // Combine with follow-up
    const refinedQuery = `${prevTerms.join(' ')} ${followUp}`;

    // Apply context filter if follow-up is about a specific previous result
    const contextFilter = previousResults && previousResults[0]?.chunk?.url ? previousResults[0].chunk.url : undefined;

    return { refinedQuery, contextFilter };
  }

  private randomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private extractKeyTerms(query: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set(['what', 'is', 'the', 'how', 'do', 'i', 'can', 'you', 'a', 'an', 'of', 'in', 'to', 'for', 'about', 'on', 'with', 'from', 'at', 'by']);
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.has(word) && word.length > 2);
  }
}
