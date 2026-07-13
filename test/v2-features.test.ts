import { describe, it, expect, vi } from 'vitest';
import { ConversationHandler } from '../src/client/conversation-handler.js';
import { SecurityManager } from '../src/client/security.js';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../src/client/error-handler.js';
import { PerformanceOptimizer } from '../src/client/performance.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';

describe('DepthIndex 1.0.1 New Features', () => {

  it('ConversationHandler: Greeting & Intent Classification', async () => {
    const handler = new ConversationHandler();
    
    const intentRes = handler.detectIntent('Hello, how can you help me?');
    expect(intentRes.intent).toBe('greeting');
    expect(intentRes.isConversational).toBe(true);

    const reply = await handler.handleConversational(intentRes.intent);
    expect(
      reply.includes('Hello') || reply.includes('Hi there') || reply.includes('Hey')
    ).toBe(true);
    expect(reply.toLowerCase()).toContain('doc');

    // Follow up testing
    const followUp = handler.handleFollowUp('how to install packages', [], 'and configure it');
    expect(followUp.refinedQuery).toContain('install package');
    expect(followUp.refinedQuery).toContain('configure');
  });

  it('SecurityManager: Attack Pattern Blocking & Sanitization', () => {
    const security = new SecurityManager();
    
    // Check XSS script blocking
    const xssCheck = security.validateQuery('What is index <script>alert(1)</script>?');
    expect(xssCheck.valid).toBe(false);
    expect(xssCheck.code).toBe('SUSPICIOUS_PATTERN');

    // Check SQL Injection blocking
    const sqliCheck = security.validateQuery('SELECT * FROM users WHERE password LIKE "%"');
    expect(sqliCheck.valid).toBe(false);
    expect(sqliCheck.code).toBe('SUSPICIOUS_PATTERN');

    // Check path traversal blocking
    const pathCheck = security.validateQuery('Show me ../../etc/passwd content');
    expect(pathCheck.valid).toBe(false);

    // Safe query should pass
    const safeCheck = security.validateQuery('How to configure search engine?');
    expect(safeCheck.valid).toBe(true);
    expect(safeCheck.sanitized).toContain('How to configure');
  });

  it('ErrorHandler: Error sanitization & logging', () => {
    const errorHandler = new ErrorHandler({ enabled: false }); // disable reporting for tests

    // Check redacting secrets in error messages
    const err = errorHandler.handleError(
      new Error('API request failed: apiKey=sk-1234567890abcdef1234567890abcdef'),
      ErrorCategory.CLOUD_API,
      ErrorSeverity.ERROR
    );

    expect(err.message).not.toContain('sk-1234567890');
    expect(err.message).toContain('apiKey=[REDACTED]');
  });

  it('PerformanceOptimizer: Cache Hit / Miss logic', async () => {
    // Mock the search engine
    const mockEngine = {
      search: vi.fn().mockReturnValue([{ chunk: { url: '/test.html', pageTitle: 'Test', heading: 'Test', content: 'Test content' }, score: 0.95 }])
    } as unknown as DepthIndexEngine;

    const optimizer = new PerformanceOptimizer(mockEngine);
    
    // First query should be a cache miss and call search
    const res1 = await optimizer.search('how to query');
    expect(mockEngine.search).toHaveBeenCalledTimes(1);
    expect(res1.length).toBe(1);

    // Second query (same text) should hit cache, so mockEngine.search shouldn't be called again
    const res2 = await optimizer.search('how to query');
    expect(mockEngine.search).toHaveBeenCalledTimes(1);
    expect(res2[0].chunk.pageTitle).toBe('Test');
  });

});
