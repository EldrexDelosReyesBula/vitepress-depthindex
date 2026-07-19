---
title: Core API Reference
description: API documentation for all core classes and entry points of VitePress DepthIndex.
---

# Core API Reference

Explore the core JavaScript classes and modules exported by VitePress DepthIndex at version `1.1.6`.

## DepthIndex Plugin
The main plugin function registered in VitePress config:
```typescript
import DepthIndex from 'vitepress-plugin-depthindex';
// Usage in Vite configuration
export default {
  plugins: [DepthIndex(options)]
}
```

## DepthIndexOptions
The complete options dictionary interface. Deep merges default parameters with user settings. See [TypeScript Types Reference](/api/types) for the full interface.

## SearchEngine
Class that manages query tokenization, stemming, keyword matching (BM25), and semantic dot-product similarity (Cosine Similarity) over local IndexedDB caches. Runs operations asynchronously inside a Web Worker.

## AnswerSynthesizer
Class responsible for structuring answers. In on-device mode, it maps user query intents to local documentation segments. In hybrid/cloud modes, it packages contextual prompts and feeds them to cloud providers.

## CloudAdapter
Bridges client-side queries to cloud AI endpoints (Google Gemini, OpenAI, or Anthropic Claude). Implements BYOK (Bring Your Own Key) security configurations and handles API request retries.

## ErrorHandler
Handles runtime exceptions, error categorization, and reporting actions. Implements error recovery loops and formats logs for email, GitHub, or custom HTTP log sinks.

## PIIDetector
Evaluates text and queries to identify personally identifiable information (PII). Detects and scrubs matching emails, phone numbers, and API credentials from data payloads.

## SessionManager
Manages multi-turn conversation logs and user query histories, enforcing memory-quota bounds to prevent IndexedDB storage overflows.

## TranslationEngine
Translates UI labels, placeholder elements, settings text, and system prompts to target languages. Supports built-in English (`en`) and Tagalog (`tl`) packs.

## AnalyticsEngine
Logs privacy-compliant, anonymized events. Validates all events against Privacy Firewall variables before database storage or upload.

## SecureUpdateEngine
Maintains search index file integrity using cryptographic signature verification (ECDSA SHA-256). Manages delta index updates and downloads page changes dynamically.

## DeviceAdapter
Evaluates hardware properties (RAM, CPU cores, GPU capabilities, connection speeds) to classify devices into Low, Medium, or High tiers, dynamically tuning vector quantization and thread usage parameters.
