---
title: "How Answer Synthesis Works: From Search Results to Natural Responses"
description: "An in-depth look at how search matches are clustered, parsed, and formatted into readable markdown answers."
---

# How Answer Synthesis Works

Searching is only half the battle. The core feature of DepthIndex is **Answer Synthesis**—taking a set of matching search results and combining them into a natural, cohesive, and easy-to-read answer.

Here is the exact pipeline DepthIndex uses to transform raw search blocks into user responses:

```
┌──────────────────────────────────────┐
│        User submits query            │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│      Query Intent Analysis (NLU)     │
│  Classifies query type:              │
│  - Definition (What is)              │
│  - Step-by-step (How to)             │
│  - Solution (Troubleshooting)        │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│         Document Clustering          │
│  Groups search results by topic,    │
│  headings, and document proximity    │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│         Content Extraction           │
│  Extracts sentences containing key   │
│  query terms. Discards raw tables,   │
│  code block boundaries, and SVGs.    │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│        Synthesis & Citation          │
│  Builds the answer structure and    │
│  inserts superscript tags matching    │
│  citations at the bottom.            │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│          Rich Text Render            │
│  Converts inline markdown, links,   │
│  tables, and blockquotes to clean    │
│  HTML ready for display in Vue.      │
└──────────────────────────────────────┘
```

## Intent-Driven Templates

Our local synthesizer relies on intent classification:
* **How-To Intent**: Synthesizes a numbered list of steps extracted from matching sections.
* **Definition Intent**: Focuses on the first sentence of highly scored paragraphs, placing examples in a secondary block.
* **Troubleshooting Intent**: Formats results as *Problem* and *Solution* cards.

By tailoring the answer structure to the user's intent, DepthIndex delivers an automated experience that feels handcrafted.
