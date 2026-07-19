---
title: Limitations & Use Cases
description: Understand constraints, alternatives comparison, and best fit use cases.
---

# Limitations & Use Cases

## Current Limitations
While VitePress DepthIndex is a powerful tool, it has several limitations:
- **Client Storage Quotas**: Browser policies limit the size of local storage and IndexedDB. In low-storage environments, the browser may evict search indexes, requiring a re-download when connection is restored.
- **Client RAM & CPU Bounds**: On-device vector parsing and keyword matching require client-side CPU processing. On very low-end mobile devices, running searches may cause minor rendering delays.
- **Template Synthesis Constraints**: On-device answer synthesis uses template-based response formatting rather than generative models. For conversational answers, you must configure hybrid or cloud modes.
- **Index Payload Overhead**: For very large documentation sites (over 2,000 pages), the index JSON payload can grow to several megabytes, increasing first-visit download sizes.

## When to Use DepthIndex
DepthIndex is ideal for:
- Sites that demand high privacy compliance (such as internal corporate developer wikis or medical product documentations).
- Applications that require full offline support (such as field engineer references, airplane manuals, or maritime guides).
- Open-source projects looking to provide modern AI-native search capabilities without incurring recurring vendor costs.
- Small to medium-sized documentation sites (typically under 1,000 pages).

## When Not to Use
Avoid using DepthIndex if:
- Your documentation has tens of thousands of pages (in which case the local index payload is too large to download).
- You require deep, multi-source external search integrations (e.g. searching across GitHub, Jira, and Slack in a single interface).
- You want to completely block users from using cloud API models or entering custom keys.

## Comparison with Alternatives

### vs Algolia
- **Cost**: Algolia requires subscription plans for enterprise sites, while DepthIndex is open-source and free to self-host.
- **Offline Support**: Algolia requires an active internet connection to run searches, while DepthIndex works completely offline.
- **AI Answers**: Algolia provides keyword matching only, while DepthIndex includes a conversational assistant.

### vs Inkeep
- Inkeep is a cloud-based enterprise solution. DepthIndex is lightweight, client-focused, and keeps all configuration variables local.

### vs Mendable
- Mendable routes all requests through cloud databases. DepthIndex includes a local Privacy Firewall to sanitize data on the user's device.

### vs Custom Solutions
- Building a custom RAG (Retrieval-Augmented Generation) pipeline requires setting up vector databases, API gateways, and client UI components. DepthIndex provides all of this out-of-the-box with a single Vite plugin.

## Roadmap
Planned features for upcoming releases:
- Support for dense neural embeddings on-device using WebGPU.
- Shared indexing pipelines for multiple subdomains.
- Extended integrations with Docusaurus and MkDocs portals.

## Feature Requests
If you want to suggest features or report bugs:
1. Search active requests in the [GitHub Issues](https://github.com/EldrexDelosReyesBula/vitepress-depthindex/issues).
2. If the request does not exist, open a new issue describing your feature goals.
