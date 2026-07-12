---
title: Overview
description: Learn how VitePress DepthIndex provides on-device hybrid search and conversational AI for documentations offline.
---

# VitePress DepthIndex Guide

**VitePress DepthIndex** is a production-grade, offline-first search and reasoning engine designed to turn standard documentation sites into AI-native experiences. 

Unlike traditional doc-search options (which require heavy cloud scraping, proprietary APIs, or paywalls), DepthIndex works entirely on-device, processing indices in your browser without sacrificing user privacy or incurring API costs.

## Key Features

1. **On-Device Hybrid Search**: Combines **BM25 keyword retrieval** (exact matching) with **dense TF-IDF Cosine similarity** (semantic vector similarity) in a single unified client-side search engine.
2. **AI-Powered Chat Assistant**: Offers a conversational UI directly on top of your docs. Answers questions using local document synthesis or hybrid cloud models.
3. **PWA & Offline-First Support**: Integrates service workers to cache search indexes and HTML pages, allowing fully functioning documentation search and chat while completely disconnected.
4. **LLMs.txt Auto-Generation**: Builds optimized documentation summaries at build time (`llms.txt`, `llms-full.txt`, and `llms.jsonl`) for search agents or external LLM scraping.
5. **No Telemetry / Privacy-First**: Zero external network requests by default. Personalization settings (such as query history and topic affinity tracking) are stored locally in the browser.

## Architecture

The plugin is split into two parts:
* **Build-Time Indexer**: Crawls all markdown files, chunks sections logically, calculates TF-IDF document frequencies, builds inverted index posting lists, and emits compressed index assets.
* **Client Runtime**: Unpacks compressed index lazily, handles NLP stemming/expansion, and powers the Vue-based Search Modal and Conversational Chat overlay.
