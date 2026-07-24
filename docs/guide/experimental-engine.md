# Experimental Local Intelligence Engine & Framework-Agnostic Core (v1.3.0)

DepthIndex v1.3.0 introduces an experimental, on-device local intelligence engine along with a framework-agnostic core abstraction (`@depthindex/core`), automated documentation health auditing, and interactive UI widgets.

---

## 🧪 Experimental Local Intelligence Engine

The local intelligence engine replaces static sentence extraction with NLU semantic chunking, a local knowledge graph, multi-step NLU reasoning, and context-aware answer synthesis.

### Enable via Configuration

```typescript
// .vitepress/config.ts
DepthIndex({
  experimental: {
    enabled: true,        // OFF by default
    mode: 'auto',         // Auto-select best available mode
    modelSize: 'small',   // Balanced small model size
    enableReasoning: true,
    enableKnowledgeGraph: true,
  },
})
```

### Core Experimental Components

1. **Semantic Chunker (`SemanticChunker`)**:
   Categorizes documentation into typed semantic units (`instruction`, `configuration`, `example`, `definition`, `explanation`, `reference`), extracts key terms, and generates Float32 TF-IDF vectors for cosine similarity relations.

2. **Local Knowledge Graph (`KnowledgeGraph`)**:
   Constructs concept, page, and section nodes, models relationships (`references`, `related_to`, `prerequisite`, `configures`, `extends`), and enables BFS graph traversal and concept explanation path discovery.

3. **Multi-Step NLU Reasoning Engine (`ReasoningEngine`)**:
   Executes a 5-step pipeline:
   - `UNDERSTAND`: Intent parsing, entity extraction, and query complexity estimation.
   - `RETRIEVE`: Semantic chunk retrieval with intent-based type boosting.
   - `ANALYZE`: Coverage analysis and gap identification.
   - `SYNTHESIZE`: Intent-tailored natural language synthesis.
   - `VERIFY`: Source grounding, hallucination prevention check, and confidence evaluation.

---

## 🌐 Framework-Agnostic Core (`DepthIndexCore`)

Extracts the core search and synthesis logic from VitePress so DepthIndex can run on any SSG framework or custom documentation application.

### Basic Usage

```typescript
import { DepthIndexCore } from 'vitepress-plugin-depthindex';

const core = new DepthIndexCore({
  pages: myExtractedPages,
  mode: 'local',
});

await core.init();

// Search & Synthesize API
const result = await core.ask('How do I configure DepthIndex?');
console.log(result.answer, result.citations, result.confidence);

// Mount UI to any element
core.mountUI('#search-container');
```

---

## 🩺 Documentation Health Audits (`HealthAuditor`)

Run automated health audits on your documentation assets to detect structural issues and maintain high documentation quality.

```typescript
import { HealthAuditor, SemanticChunker, KnowledgeGraph } from 'vitepress-plugin-depthindex';

const chunker = new SemanticChunker();
const chunks = chunker.chunkify(pages);
const graph = new KnowledgeGraph();
graph.build(chunks);

const auditor = new HealthAuditor();
const report = auditor.audit(chunks, graph);

console.log(`Documentation Health Score: ${report.score}/100`);
console.log(`Orphaned Pages:`, report.orphanedPages);
console.log(`Missing Code Examples:`, report.missingCodeExamples);
console.log(`Contradictions:`, report.contradictorySections);
```

---

## ⚡ Interactive Search UI (`InteractiveSearch`)

Enhances user interaction with inline context widgets and code block playgrounds.

### "Explain This" Contextual Floating Widget
Highlight text anywhere on a page and press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) to bring up the inline explanation widget and ask questions directly.

### Code Playground
Adds interactive "Run" and "Edit" action buttons to code snippets with safe execution and output rendering.
