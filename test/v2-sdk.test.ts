import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginRegistry, PluginPermission, PluginManifest } from '../src/sdk/index.js';
import { ComplianceEnforcer } from '../src/sdk/compliance.js';
import { I18nAPI } from '../src/extensions/i18n/index.js';

describe('DepthIndex 1.1.0 Plugin SDK & Compliance Framework', () => {

  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should register and activate a compliant plugin successfully', async () => {
    const manifest: PluginManifest = {
      id: 'test-compliant-plugin',
      name: 'Compliant Plugin',
      version: '1.0.0',
      description: 'A compliant mock plugin',
      author: { name: 'SDK Test Author' },
      permissions: [PluginPermission.READ_DOCS],
      minDepthIndexVersion: '1.1.0',
      dataDisclosure: {
        collectsData: false,
        storageLocation: 'local',
        thirdPartySharing: false,
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        phDataPrivacy: true,
        piiHandling: 'none',
        securityMeasures: ['None required'],
      },
    };

    let registerCalled = false;
    let activateCalled = false;

    const hooks = {
      onRegister: () => {
        registerCalled = true;
      },
      onActivate: () => {
        activateCalled = true;
      },
    };

    const result = await registry.register(manifest, hooks);
    expect(result.success).toBe(true);
    expect(registerCalled).toBe(true);

    await registry.activate(manifest.id);
    expect(activateCalled).toBe(true);
  });

  it('should block a plugin requesting external communication without endpoints disclosure', async () => {
    const manifest: PluginManifest = {
      id: 'test-noncompliant-plugin',
      name: 'Non Compliant Plugin',
      version: '1.0.0',
      description: 'A non-compliant mock plugin',
      author: { name: 'SDK Test Author' },
      permissions: [PluginPermission.EXTERNAL_COMMUNICATION],
      minDepthIndexVersion: '1.1.0',
      dataDisclosure: {
        collectsData: false,
        storageLocation: 'external',
        thirdPartySharing: false,
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        phDataPrivacy: true,
        piiHandling: 'none',
        securityMeasures: [],
      },
    };

    const result = await registry.register(manifest, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('without disclosing endpoints');
  });

  it('should block a plugin collecting data without disclosing details', async () => {
    const manifest: PluginManifest = {
      id: 'test-nondisclosing-plugin',
      name: 'No Disclosure Plugin',
      version: '1.0.0',
      description: 'Mock plugin',
      author: { name: 'SDK Test Author' },
      permissions: [],
      minDepthIndexVersion: '1.1.0',
      dataDisclosure: {
        collectsData: true,
        storageLocation: 'local',
        thirdPartySharing: false,
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        phDataPrivacy: true,
        piiHandling: 'none',
        securityMeasures: [],
      },
    };

    const result = await registry.register(manifest, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('does not disclose what is collected');
  });

  it('should produce warning for active PII handling and format notice markdown', () => {
    const manifest: PluginManifest = {
      id: 'test-pii-plugin',
      name: 'PII Plugin',
      version: '1.0.0',
      description: 'PII plugin',
      author: { name: 'SDK Test Author' },
      permissions: [],
      minDepthIndexVersion: '1.1.0',
      dataDisclosure: {
        collectsData: true,
        collectedData: ['emails'],
        storageLocation: 'local',
        thirdPartySharing: false,
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        phDataPrivacy: true,
        piiHandling: 'processed',
        securityMeasures: ['Encrypted'],
      },
    };

    const mockRegPlugin = {
      manifest,
      hooks: {},
      context: {} as any,
      status: 'registered' as const,
      registeredAt: Date.now(),
    };

    const report = ComplianceEnforcer.validateAllPlugins([mockRegPlugin]);
    expect(report.passed).toBe(true);
    expect(report.warnings.length).toBe(1);
    expect(report.warnings[0].type).toBe('pii_handling');

    const notice = ComplianceEnforcer.generateDisclosureNotice(report);
    expect(notice).toContain('Data Handling Disclosures');
    expect(notice).toContain('PII Plugin');
    expect(notice).toContain('emails');
  });

});

describe('DepthIndex 1.1.0 i18n Extension', () => {

  it('should translate built-in en and tl keys and support switching', () => {
    const i18n = new I18nAPI();
    
    // Default is English
    expect(i18n.getCurrentLanguage()).toBe('en');
    expect(i18n.t('panel.title')).toBe('Documentation Assistant');
    expect(i18n.t('search.found', { count: 5 })).toBe('Found 5 relevant sections');

    // Switch to Tagalog
    i18n.setLanguage('tl');
    expect(i18n.getCurrentLanguage()).toBe('tl');
    expect(i18n.t('panel.title')).toBe('Katulong sa Dokumentasyon');
    expect(i18n.t('search.found', { count: 3 })).toBe('Nakahanap ng 3 kaugnay na seksyon');
  });

  it('should fall back to English if translation is missing in the requested pack', () => {
    const i18n = new I18nAPI();
    
    // Register custom pack containing all required keys, but missing 'search.analyzing'
    i18n.registerPack({
      code: 'fr-mock',
      nativeName: 'French Mock',
      englishName: 'French Mock',
      direction: 'ltr',
      author: { name: 'French Author' },
      translations: {
        'panel.title': 'Assistant French',
        'panel.send': 'Envoyer',
        'panel.close': 'Fermer',
        'search.thinking': 'Reflexion',
        'search.noResults': 'No results',
        'answer.references': 'References',
      },
    });

    i18n.setLanguage('fr-mock');
    expect(i18n.t('panel.title')).toBe('Assistant French');
    
    // 'search.analyzing' is missing in fr-mock, should fallback to English 'Analyzing results...'
    expect(i18n.t('search.analyzing')).toBe('Analyzing results...');
  });

});
