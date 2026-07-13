export function generateCompliancePage(config: {
  projectName: string;
  creatorName: string;
  creatorLocation: string;
  contactEmail?: string;
  repoUrl: string;
  license: string;
}): string {
  return `---
title: Privacy & Compliance
description: Data handling, privacy practices, and legal compliance information
---

# 🔐 Privacy & Compliance

## Overview

**${config.projectName}** is committed to protecting user privacy and maintaining compliance with applicable data protection regulations. This page documents our data handling practices.

---

## 📜 Legal Disclaimer

**AS-IS BASIS**: This software is provided "AS-IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.

**No Professional Advice**: The AI assistant provides documentation-related information only. It does not constitute professional, legal, medical, or financial advice.

---

## 🇵🇭 Creator Jurisdiction

**Creator**: ${config.creatorName}  
**Location**: ${config.creatorLocation}  
**Repository**: [${config.repoUrl}](${config.repoUrl})  
**License**: ${config.license}

This software is created and maintained from the **Republic of the Philippines**. Users and contributors are subject to applicable Philippine laws including:

- **Republic Act No. 10173** — Data Privacy Act of 2012
- **Republic Act No. 10175** — Cybercrime Prevention Act of 2012
- **Republic Act No. 8792** — Electronic Commerce Act of 2000

---

## 🔒 Data Handling Practices

### What We DO NOT Collect

| Data Type | Collected? | Notes |
|-----------|------------|-------|
| Personal Information (PII) | ❌ **No** | Name, email, phone, address, TIN, SSS, PhilHealth |
| Location Data | ❌ **No** | GPS, IP-based location |
| Browsing History | ❌ **No** | Pages visited, time on page |
| Search Queries | ❌ **No** | Questions asked to the AI |
| Device Fingerprints | ❌ **No** | Browser/device identification |
| Analytics/Telemetry | ❌ **No** | Usage statistics, crash reports |

### What IS Stored Locally

| Data Type | Storage | Purpose | User Control |
|-----------|---------|---------|--------------|
| Chat History | Browser IndexedDB | Session persistence | ✅ Clear anytime |
| API Keys (Cloud AI) | Browser localStorage | Cloud AI configuration | ✅ Remove anytime |
| UI Preferences | Browser localStorage | Theme, position settings | ✅ Reset anytime |
| Documentation Index | Browser Cache | Offline search capability | ✅ Clear cache |

### Cloud AI Data Flow

\`\`\`
┌─────────────┐     Direct Connection     ┌──────────────┐
│  User's      │ ─────────────────────────> │  AI Provider  │
│  Browser     │ <───────────────────────── │  (OpenAI,     │
│              │     Response               │   Gemini,     │
└─────────────┘                            │   Anthropic)  │
       │                                     └──────────────┘
       │                                            │
       │  NO intermediary                          │
       │  NO logging                               │
       │  NO storage                               │
       ▼                                            ▼
  DepthIndex does NOT see,      Provider's privacy
  store, or process cloud       policy applies
  AI queries/responses
\`\`\`

---

## 🛡️ Security Measures

### Input Sanitization
- All user queries are sanitized for PII before processing
- XSS protection via DOMParser-based sanitization
- SQL injection pattern detection and blocking
- Rate limiting to prevent abuse

### Data in Transit
- Cloud AI requests use HTTPS encryption
- Direct browser-to-provider connections (no proxy)
- API keys stored encrypted in browser storage

### Data at Rest
- All data stored in browser-local storage only
- No server-side databases or logging
- IndexedDB with proper indexing and transaction support

---

## 🌍 International Compliance

### GDPR (EU/EEA)
By default, DepthIndex processes all data locally on the user's device. No personal data is collected or transferred. When users optionally configure cloud AI, data is sent directly to the AI provider — DepthIndex acts as a **data conduit, not a data controller or processor**.

### CCPA (California)
DepthIndex does not collect, sell, or share personal information as defined by the California Consumer Privacy Act.

### PIPEDA (Canada)
DepthIndex's default configuration complies with PIPEDA's privacy principles by processing all data locally without collection.

---

## ⚙️ Developer Configuration

When integrating DepthIndex into your documentation:

1. **Default Mode**: Offline-only, zero data collection
2. **Cloud AI**: Optional, user-configured with their own API keys
3. **Error Reporting**: Optional, configurable (GitHub/Email/Custom)
4. **Usage Logging**: Opt-in only, stored locally

### Environment Variables

Documentation owners can pre-configure cloud AI:
\`\`\`bash
# Set on deployment platform (Vercel/Netlify)
VITE_DEPTHINDEX_CLOUD_PROVIDER=gemini
VITE_DEPTHINDEX_CLOUD_API_KEY=your-api-key
VITE_DEPTHINDEX_SCOPE_TO_DOCS=true  # Limit to documentation only
\`\`\`

---

## 📞 Contact

For privacy concerns or compliance questions:  
${config.contactEmail ? `📧 [${config.contactEmail}](mailto:${config.contactEmail})` : '📧 Open an issue on the repository'}

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
*This document applies to version 1.0.1 of DepthIndex*
`;
}
