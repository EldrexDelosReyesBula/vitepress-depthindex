---
title: "Understanding Search Modes: Local vs Hybrid vs Cloud"
description: "Compare the three query execution strategies available in DepthIndex to select the best setup for your site."
---

# Understanding Search Modes: Local vs Hybrid vs Cloud

DepthIndex allows documentation site owners to choose how queries are processed using three distinct search modes. Understanding these modes helps you balance offline-first capability, processing power, and hosting costs.

## Comparison at a Glance

| Feature | Local Mode | Hybrid Mode | Cloud Mode |
| :--- | :--- | :--- | :--- |
| **Execution Location** | 100% on user's device | Local search first + Cloud API fallback | 100% on remote Cloud server |
| **API Costs** | $0 | Low (only for complex queries) | Moderate |
| **Offline Support** | Yes (fully functional offline) | Partial (falls back to local offline) | No |
| **Response Quality** | Good (templated from snippets) | Excellent (summarized by LLM) | Excellent |
| **Setup Complexity** | Zero configuration | API key required | API key + Server configuration |

---

## 1. Local Mode (Offline-First)

Local mode is the default. The entire search, query parsing, and synthesis pipeline executes on the user's device.

* **How it works**: The client downloads the compiled documentation index during page load. Query relevance scores are computed locally, and the `AnswerSynthesizer` builds answers using pre-structured templates from matching document paragraphs.
* **Best for**: Open-source projects, offline documentation, and sites prioritizing privacy and zero hosting fees.

## 2. Hybrid Mode (Recommended)

Hybrid mode blends the speed of local search with the advanced reasoning of large language models.

* **How it works**: When a user submits a query, DepthIndex executes a local search first. If the query is simple, the local answer is returned instantly. If the query is complex, DepthIndex sends the localized search results (snippets) to a cloud LLM to synthesize a natural-language response.
* **Best for**: Public developer portals where maximum answer quality is desired without leaking full text repositories to external servers.

## 3. Cloud-Only Mode

Cloud mode shifts all operations to a remote server, stripping the local database payload completely.

* **How it works**: The client only loads a lightweight page manifest. Queries are sent to a cloud endpoint which searches the corpus and returns the final answer.
* **Best for**: Massive documentation sites (over 10,000 pages) where downloading a local index would consume too much device memory.
