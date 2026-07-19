---
layout: home

hero:
  name: DepthIndex
  text: On-Device Search & AI
  tagline: "Offline-first, zero-latency hybrid search and conversational AI for VitePress documentation."
  image:
    src: /vitepress-depthindex-official-logo.svg
    alt: DepthIndex Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View API Reference
      link: /api/

features:
  - icon: 🔍
    title: Hybrid Vector Search
    details: Combines BM25 exact keyword matching and dense TF-IDF Cosine vector similarity entirely locally.
  - icon: 💬
    title: Conversational AI
    details: Renders a floating chat assistant capable of synthesizing document sections offline or via cloud models.
  - icon: ⚡
    title: PWA Offline-First
    details: Pre-registers a service worker to cache search index assets and HTML pages for fully offline documentation.
  - icon: 🛡️
    title: Privacy-First
    details: Zero analytics or external logging. Personalization data and optional API keys are kept strictly in local storage.
---


# VitePress DepthIndex

> On-device intelligence layer for VitePress documentation.

## What is DepthIndex?
VitePress DepthIndex is a production-grade, offline-first search and reasoning engine designed to turn standard documentation sites into AI-native experiences. Operating completely inside the user's browser, it combines BM25 exact keyword matching with sparse TF-IDF Cosine similarity vector modeling to enable fast queries without relying on expensive server-side databases or subscription-based paywalls. It runs entirely local search and synthesis, with optional hooks to leverage cloud-based large language models (LLMs) when needed.

## Key Features
- **[On-Device Search](/guide/search-modes)**: Run keyword matching and semantic vector searches locally at near-zero latency.
- **[AI Answer Synthesis](/guide/answer-synthesis)**: Synthesize accurate, context-grounded answers to natural language questions.
- **[Offline PWA](/guide/offline-pwa)**: Keep search and chat assistants active offline with built-in service worker caching.
- **[Privacy Firewall](/guide/privacy-firewall)**: Scrub sensitive keys and personal data on the client side before any cloud calls.
- **[SEO & Discoverability](/guide/seo)**: Optimize site indexing with automatic metadata injection and `llms.txt` generation.

## Quick Start
Get up and running with DepthIndex in three simple steps:
1. Install the package: `npm install vitepress-plugin-depthindex`
2. Add the plugin to your Vite configuration inside `.vitepress/config.ts`.
3. Check the detailed setup instructions in the [Quick Start Guide](/guide/quick-start).

## Who Uses This?
VitePress DepthIndex is built for open-source maintainers, technical writers, and software teams who want to provide a state-of-the-art conversational documentation assistant. It is ideal for sites that demand high privacy compliance, offline functionality (such as on-site operator manuals), or zero ongoing API usage fees.

## Get Started
- [Explore the Guide](/guide/)
- [Check API Reference](/api/)
- [View Examples](/examples/basic)
