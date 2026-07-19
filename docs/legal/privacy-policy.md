---
title: Privacy Policy
description: Privacy policy, data disclosures, storage specifications, and regulatory compliance.
---

# Privacy Policy

## Data Collection
VitePress DepthIndex is a privacy-first plugin:
- By default, it does not collect, record, or upload any personal data.
- Search queries, chat transcripts, and settings choices are processed locally in the user's browser.
- If analytics tracking is enabled, only anonymized aggregate metrics (e.g. search volumes) are recorded.

## Data Storage
All personalization data (such as query history and topic affinities) are stored locally in the browser's `localStorage` or `indexedDB` databases. This data stays on the user's device and is never shared.

## Cloud AI Data Flow
When running in hybrid or cloud modes:
1. User queries are evaluated locally.
2. The client-side Privacy Firewall scrubs PII (such as emails, phone numbers, and API tokens).
3. The cleaned text is sent directly to your configured cloud provider (Google Gemini, OpenAI, or Anthropic).
4. Cloud providers process requests according to their API privacy terms, which prohibit using API data for model training.

## User Rights
Users have full control over their data:
- **Right to Delete**: Users can clear their search history, personalization data, and telemetry records at any time from the chat panel settings.
- **Opt-Out**: Users can disable history tracking, analytics, and cloud AI features globally.

## Philippine Compliance
Complies with the **Republic Act No. 10173 (Data Privacy Act of 2012)**. We implement administrative and technical security measures (PII firewall, browser isolation) to protect personal data from unauthorized access or exposure.

## International
DepthIndex complies with international data protection laws, including:
- **GDPR**: General Data Protection Regulation (European Union).
- **CCPA**: California Consumer Privacy Act (United States).

## Contact
If you have questions about this Privacy Policy or your data:
- Contact the creator via email: `eldrexdelosreyesbula@gmail.com`.
