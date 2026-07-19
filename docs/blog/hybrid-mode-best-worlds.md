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

```
                  User Query
                      │
                      ▼
             Run Local TF-IDF Search
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
    Is query simple?     Is query complex?
  (Direct definition)   (Conceptual tutorial)
            │                   │
            ▼                   ▼
     Return Local       Fetch Cloud LLM
    Synthesized Answer  (Piping local snippets)
            │                   │
            ▼                   ▼
      Instant (0ms)     Rich response with
                        inline citations
```

## Resilience and Offline Fallback

A key benefit of Hybrid mode is resilience. If the user loses network connectivity, or if your cloud API key hits a rate limit, DepthIndex falls back to Local mode. The user still receives a local search answer instead of an error message.

This ensures your documentation assistant remains functional under any conditions.
