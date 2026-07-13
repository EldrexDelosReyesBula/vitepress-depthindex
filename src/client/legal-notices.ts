export const LEGAL_NOTICES = {
  DISCLAIMER: `AS-IS BASIS: VitePress DepthIndex is provided "AS-IS", without warranty of any kind, express or implied. The creator(s) make no representations or warranties regarding the accuracy, completeness, or reliability of the AI-generated responses.

NO PROFESSIONAL ADVICE: The AI assistant provides documentation-related information only. It does not constitute professional, legal, medical, or financial advice.

LIMITATION OF LIABILITY: In no event shall the creators be liable for any damages arising from the use or inability to use this software.

THIRD-PARTY INTEGRATIONS: When configured with cloud AI providers (OpenAI, Google Gemini, Anthropic Claude), data processing is subject to those providers' respective privacy policies and terms of service. DepthIndex does NOT act as an intermediary, processor, or sub-processor for these integrations.

DOCUMENTATION SCOPE: By default, DepthIndex only searches within the documentation where it is installed. Any external data access requires explicit developer configuration and is NOT enabled by default.`,

  PRIVACY_NOTICE: `NO TRACKING: DepthIndex does NOT use analytics, telemetry, tracking pixels, cookies (beyond essential functionality), or any form of user monitoring.

NO PII COLLECTION: The plugin does NOT collect, store, transmit, or process Personally Identifiable Information (PII) from documentation readers.

LOCAL-FIRST ARCHITECTURE: All search processing happens on the user's device by default. Query data never leaves the browser unless cloud AI is explicitly configured.

CLOUD AI DATA HANDLING: When cloud AI is enabled, queries are sent DIRECTLY from the user's browser to the AI provider. DepthIndex does NOT proxy, log, or store these requests.

OPEN SOURCE: The entire codebase is publicly available for security audits. No obfuscated code, hidden trackers, or backdoors.`,

  PHILIPPINE_COMPLIANCE: `CREATOR JURISDICTION: This software is created and maintained from the Republic of the Philippines.

APPLICABLE LAWS: Users and contributors are subject to applicable Philippine laws including but not limited to:
- Republic Act No. 10173 (Data Privacy Act of 2012)
- Republic Act No. 10175 (Cybercrime Prevention Act of 2012)
- Republic Act No. 8792 (Electronic Commerce Act of 2000)

INTERNATIONAL USERS: By using this software, international users acknowledge that data processing may occur across borders and agree to comply with their local data protection regulations (GDPR, CCPA, PIPEDA, etc.) when configuring cloud AI integrations.

NPC COMPLIANCE: The National Privacy Commission (NPC) of the Philippines guidelines on data privacy are observed in the default offline configuration.`
};

export const COMPLIANCE_BADGES = {
  NO_TRACKING: {
    label: 'No Tracking',
    description: 'Zero analytics, telemetry, or user monitoring',
    icon: '🚫',
  },
  NO_PII: {
    label: 'No PII Collection',
    description: 'Does not collect personally identifiable information',
    icon: '🔒',
  },
  LOCAL_FIRST: {
    label: 'Local-First',
    description: 'All processing on-device by default',
    icon: '💻',
  },
  OPEN_SOURCE: {
    label: 'Open Source',
    description: 'Publicly auditable codebase (MIT License)',
    icon: '📖',
  },
  PH_COMPLIANT: {
    label: 'PH Data Privacy Compliant',
    description: 'Compliant with RA 10173 (Data Privacy Act of 2012)',
    icon: '🇵🇭',
  },
};
