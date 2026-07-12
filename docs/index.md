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
