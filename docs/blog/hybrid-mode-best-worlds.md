---
title: "Hybrid Mode: The Best of Both Worlds"
description: "Why Hybrid search represents the ideal balance of speed, cost, offline resilience, and intelligence."
---

# Hybrid Mode: The Best of Both Worlds

When designing the search strategy for your documentation, you often have to choose between two extremes:
1. **Local-Only**: Fast and free, but limited in reasoning power.
2. **Cloud-Only**: Smart and flexible, but introduces latency, costs, and breaks offline.

DepthIndex introduces **Hybrid Mode** to resolve this dilemma.

## The Hybrid Architecture

Hybrid mode combines on-device search with remote synthesis. When a user submits a query, DepthIndex executes the following logic:

```mermaid
flowchart TD
    A[User submits query] --> B[Run Local TF-IDF Search]
    B --> C[Is query simple?]
    C --> D[Return Local Synthesized Answer]
    C --> E[Is query complex?]
    E --> F[Fetch Cloud LLM with local snippets]
    F --> G[Rich response with inline citations]

    D -->|Instant (0ms)| H[Instant (0ms)]
    G -->|Rich response| I[Rich response]

    B -->|Run Local TF-IDF Search|
    C -->|Direct definition| D
    E -->|Conceptual tutorial| F

    D -->|Return Local Synthesized Answer|
    G -->|Rich response with inline citations|

    H[Instant (0ms)] -->|Instant (0ms)|
    I[Rich response] -->|Rich response|
```

## Resilience and Offline Fallback

A key benefit of Hybrid mode is resilience. If the user loses network connectivity, or if your cloud API key hits a rate limit, DepthIndex falls back to Local mode. The user still receives a local search answer instead of an error message.

This ensures your documentation assistant remains functional under any conditions.

```mermaid
flowchart TD
    A[User submits query] --> B[Run Local TF-IDF Search]
    B --> C[Is query simple?]
    C --> D[Return Local Synthesized Answer]
    C --> E[Is query complex?]
    E --> F[Fetch Cloud LLM with local snippets]
    F --> G[Rich response with inline citations]

    D -->|Instant (0ms)| H[Instant (0ms)]
    G -->|Rich response| I[Rich response]

    B -->|Run Local TF-IDF Search|
    C -->|Direct definition| D
    E -->|Conceptual tutorial| F

    D -->|Return Local Synthesized Answer|
    G -->|Rich response with inline citations|

    H[Instant (0ms)] -->|Instant (0ms)|
    I[Rich response] -->|Rich response|
```

## Resilience and Offline Fallback

A key benefit of Hybrid mode is resilience. If the user loses network connectivity, or if your cloud API key hits a rate limit, DepthIndex falls back to Local mode. The user still receives a local search answer instead of an error message.

This ensures your documentation assistant remains functional under any conditions.
