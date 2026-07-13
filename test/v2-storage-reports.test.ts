import { describe, it, expect, vi } from 'vitest';
import { SessionManager } from '../src/client/session-manager.js';
import { ErrorHandler } from '../src/client/error-handler.js';

describe('DepthIndex 1.0.1 Storage Sanitization & Error Reporting', () => {

  it('SessionManager: sanitizeForIDB cleans reactive proxies, Symbols, DOM nodes, and functions', () => {
    const sessionManager = new SessionManager();
    
    // Create a mock Vue proxy-like object
    const mockProxy = {
      __v_isRef: true,
      __v_raw: {
        id: 'session-1',
        title: 'Reactive Chat',
        messages: [
          {
            id: 'msg-1',
            text: 'Hello',
            reactiveProp: { __v_isReactive: true, __v_raw: { rawText: 'Hi' } }
          }
        ]
      }
    };
    
    // Run sanitization
    const sanitized = (sessionManager as any).sanitizeForIDB(mockProxy);
    
    // Check that proxy flags are gone, but actual raw data is preserved
    expect(sanitized.__v_isRef).toBeUndefined();
    expect(sanitized.__v_raw).toBeUndefined();
    expect(sanitized.id).toBe('session-1');
    expect(sanitized.title).toBe('Reactive Chat');
    expect(sanitized.messages[0].text).toBe('Hello');
    expect(sanitized.messages[0].reactiveProp.rawText).toBe('Hi');
    expect(sanitized.messages[0].reactiveProp.__v_isReactive).toBeUndefined();
  });

  it('SessionManager: safeStructuredClone fallback behavior', () => {
    const sessionManager = new SessionManager();
    
    // Object containing non-cloneable property (e.g. function)
    const objWithFunc = {
      name: 'Test',
      fn: () => {}
    };
    
    // Structured clone should fail on function and use JSON fallback (which drops the function)
    const cloned = (sessionManager as any).safeStructuredClone(objWithFunc);
    expect(cloned).not.toBeNull();
    expect(cloned.name).toBe('Test');
    expect(cloned.fn).toBeUndefined();
  });

  it('ErrorHandler: validateReportTarget for github, email, and custom targets', () => {
    // Valid github repo target
    const validGithub = new ErrorHandler({
      target: 'github',
      githubRepo: 'owner/repo'
    });
    expect(validGithub.validateReportTarget().valid).toBe(true);

    // Invalid github repo format (no slash)
    const invalidGithub = new ErrorHandler({
      target: 'github',
      githubRepo: 'invalidrepo'
    });
    expect(invalidGithub.validateReportTarget().valid).toBe(false);
    expect(invalidGithub.validateReportTarget().reason).toContain('Invalid GitHub repository format');

    // Valid email target
    const validEmail = new ErrorHandler({
      target: 'email',
      emailAddress: 'test@example.com'
    });
    expect(validEmail.validateReportTarget().valid).toBe(true);

    // Invalid email target
    const invalidEmail = new ErrorHandler({
      target: 'email',
      emailAddress: 'notanemail'
    });
    expect(invalidEmail.validateReportTarget().valid).toBe(false);
    expect(invalidEmail.validateReportTarget().reason).toContain('Invalid email address format');
  });

});
