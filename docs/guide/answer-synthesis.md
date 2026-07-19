---
title: Answer Synthesis
description: Detail how VitePress DepthIndex classifies queries, structures answers, resolves citations, and renders media.
---

# Answer Synthesis

## Overview
VitePress DepthIndex features an intelligent query synthesis system that parses user queries, identifies their intent, filters relevant documentation, and formats structured answers. It preserves citations and renders code blocks, math, diagrams, and embeds.

## How Answers Are Built
1. **Query Parsing**: The search query is tokenized, stemmed, and expanded.
2. **Intent Analysis**: The `IntentEngine` determines the query's type and goals.
3. **Chunk Retrieval**: Local BM25 and vector searches locate matching content snippets.
4. **Synthesis Engine**: The `AnswerSynthesizer` formats the response locally (in on-device mode) or forwards it to an LLM provider (in hybrid/cloud modes).
5. **Citations & References**: The engine inserts anchor links mapping back to original document URLs.

## Intent Detection
The `IntentEngine.understand()` method processes queries to classify them into the following intent categories:

### How-To
Triggered by queries starting with "How do I...", "Steps to...", or "How to configure...". Identifies a request for step-by-step instructions.

### Definition
Triggered by queries like "What is...", "Define...", or "Meaning of...". Identifies a request for concepts and terminology explanations.

### Configuration
Triggered by "Configure...", "Settings for...", "Options for...", or config file names. Identifies a request for configuration schemas.

### Comparison
Triggered by "vs", "versus", "difference between", or "compare". Identifies a request for comparison matrices.

### Troubleshooting
Triggered by "Error...", "How to fix...", "failed", "bug", or "crash". Identifies a request for troubleshooting steps.

### General
Fallback category for conversational queries, questions, or greetings (e.g. "Hello").

## Answer Assembly
Depending on the detected intent, on-device template rendering structures responses as follows:

### How-To Answers
Formats steps as ordered lists, grouping prerequisites at the top and linking to the source files containing the implementation details.

### Definition Answers
Extracts matching definitions from the top chunks, highlighting key terms and providing related glossary concepts.

### Configuration Answers
Renders configuration tables showing options, types, default values, and description text.

### Comparison Answers
Constructs comparison matrices from matching headings, highlighting differences in features and configurations.

### Troubleshooting Answers
Splits answers into **Symptom**, **Cause**, and **Resolution** sections, highlighting error codes and logs.

## Citation System

### Inline Citations
When generating answers, DepthIndex inserts compact inline citation markers (e.g. `[1]`, `[2]`). These are rendered as `<sup><a class="cite" href="#ref-1">1</a></sup>` elements, ensuring that users can trace every claim back to a source document.

### Reference Section
The bottom of each response contains a list of references with matching indexes. Each item lists the page title and heading, formatted as a clickable link.

### Bidirectional Navigation
Clicking an inline citation focuses the reference list at the bottom of the message. In the side panel, clicking a reference highlights the relevant source page context.

## Content Rendering

### Code Blocks
Code snippets are formatted using custom syntax highlight classes. A "Copy" button is added to each code block to let users copy code easily.

### Tables
Markdown tables are rendered as responsive HTML tables with zebra-striping.

### Math (KaTeX)
Mathematical formulas in LaTeX format are rendered as beautiful formulas using KaTeX. The required KaTeX CSS is auto-injected by the build plugin:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
```

### Mermaid Diagrams
If `indexConfig.includeMermaid` is enabled, Mermaid code blocks are parsed and rendered as interactive diagrams.

### Images
Images are rendered with click-to-zoom lightboxes and fallback templates in case the image fails to load.

### YouTube Embeds
If the search results match a YouTube video URL, DepthIndex inserts an iframe embed that loads lazily on click to save bandwidth.

## Confidence Scoring
The engine calculates a confidence score for each answer based on several criteria:
- **Base Score**: 30% if any matching chunks are found.
- **Source Diversity**: Up to 25% if matching chunks span multiple different pages.
- **Relevance Score**: Up to 35% based on BM25 and Cosine similarity metrics.
- **Content Richness**: Up to 10% based on the presence of code blocks, tables, and headings in the source chunks.
Answers are displayed with a confidence rating (e.g. `Confidence: 85%`).

## Related Topics
Each answer displays a list of clickable "Related Topics" links at the bottom. These are generated from matching headings in the search results, allowing users to explore relevant sections of the documentation.
