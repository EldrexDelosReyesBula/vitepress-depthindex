import { describe, it, expect, vi } from 'vitest';
import { PIIDetector, PIICategory } from '../src/client/pii-detector.js';
import { CloudAdapter, CloudAIRequest } from '../src/client/cloud-adapter.js';
import { generateCompliancePage } from '../src/build/compliance-generator.js';

describe('DepthIndex Privacy & Compliance Framework', () => {

  describe('PIIDetector Engine', () => {
    it('should detect standard and Philippine-specific PII', () => {
      const detector = new PIIDetector();

      // Email
      const emailScan = detector.scanForPII('Contact me at support@depthindex.com or developer@gov.ph');
      expect(emailScan.some(m => m.category === PIICategory.EMAIL)).toBe(true);

      // Philippine Phone format
      const phoneScan = detector.scanForPII('Mobile: +63-917-123-4567 or 0917-123-4567');
      expect(phoneScan.some(m => m.category === PIICategory.PHONE)).toBe(true);

      // PH TIN, SSS, PhilHealth, Passport, Driver's License
      const tinScan = detector.scanForPII('TIN: 123-456-789-000');
      expect(tinScan.some(m => m.category === PIICategory.PH_PII)).toBe(true);

      const sssScan = detector.scanForPII('SSS: 12-3456789-0'); // format check
      expect(sssScan.some(m => m.category === PIICategory.SSN)).toBe(true);

      const philhealthScan = detector.scanForPII('PhilHealth: 12-345678901-2');
      expect(philhealthScan.some(m => m.category === PIICategory.PH_PII)).toBe(true);

      const passportScan = detector.scanForPII('Passport: A1234567');
      expect(passportScan.some(m => m.category === PIICategory.PH_PII)).toBe(true);

      const dlScan = detector.scanForPII("Driver's License: N12-34-567890");
      expect(dlScan.some(m => m.category === PIICategory.PH_PII)).toBe(true);
    });

    it('should sanitize PII with masking and removal methods', () => {
      const detector = new PIIDetector();

      const input = 'My email is test@domain.com and card number is 4111-1111-1111-1111';
      
      const masked = detector.sanitizePII(input, 'mask');
      expect(masked.wasSanitized).toBe(true);
      expect(masked.sanitized).toContain('t***@domain.com');
      expect(masked.sanitized).toContain('****-****-****-1111');

      const removed = detector.sanitizePII(input, 'remove');
      expect(removed.wasSanitized).toBe(true);
      expect(removed.sanitized).not.toContain('test@domain.com');
      expect(removed.sanitized).not.toContain('4111-1111-1111-1111');
    });

    it('should validate all patterns have global flags', () => {
      const validation = PIIDetector.runPatternValidation();
      expect(validation.valid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });
  });

  describe('CloudAdapter Security & PII Sanitization', () => {
    it('should validate custom endpoint configuration correctly', async () => {
      const adapter = new CloudAdapter();

      // Custom provider missing endpoint should fail validation
      const invalidConfig: CloudAIRequest = {
        provider: 'custom',
        apiKey: 'key',
        model: 'model',
        messages: []
      };

      await expect(adapter.query('test query', invalidConfig)).rejects.toThrow(
        'Custom provider requires endpoint URL in configuration.'
      );

      // Custom provider with endpoint should pass validation and try to fetch (will throw fetch error in node, which is expected/valid)
      const validConfig: CloudAIRequest = {
        provider: 'custom',
        apiKey: 'key',
        model: 'model',
        endpoint: 'http://localhost/api/completion',
        messages: []
      };

      await expect(adapter.query('test query', validConfig)).rejects.toThrow(/fetch|API error/);
    });

    it('should sanitize user query PII before passing to query', async () => {
      const adapter = new CloudAdapter();
      
      // Stub the internal query method to capture the sanitized query
      const queryOpenAISpy = vi.spyOn(adapter as any, 'queryOpenAI').mockResolvedValue({
        content: 'Response',
        model: 'model',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        latency: 10
      });

      const config: CloudAIRequest = {
        provider: 'openai',
        apiKey: 'sk-1234',
        model: 'gpt-4o-mini',
        messages: []
      };

      await adapter.query('My email is user@domain.com', config);

      expect(queryOpenAISpy).toHaveBeenCalled();
      const passedMessages = queryOpenAISpy.mock.calls[0][0] as any[];
      const userMessage = passedMessages.find((m: any) => m.role === 'user');
      expect(userMessage.content).not.toContain('user@domain.com');
      expect(userMessage.content).toContain('u***@domain.com');

      queryOpenAISpy.mockRestore();
    });
  });

  describe('Compliance Page Generator', () => {
    it('should generate valid privacy compliance markdown text', () => {
      const markdown = generateCompliancePage({
        projectName: 'VitePress DepthIndex',
        creatorName: 'Eldrex Delos Reyes Bula',
        creatorLocation: 'Philippines',
        contactEmail: 'privacy@depthindex.org',
        repoUrl: 'https://github.com/EldrexDelosReyesBula/vitepress-depthindex',
        license: 'MIT'
      });

      expect(markdown).toContain('# 🔐 Privacy & Compliance');
      expect(markdown).toContain('Republic Act No. 10173');
      expect(markdown).toContain('TIN');
      expect(markdown).toContain('privacy@depthindex.org');
    });
  });

});
