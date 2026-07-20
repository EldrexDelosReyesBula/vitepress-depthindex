# Custom Entity Examples

## Overview
By defining custom entities, you teach the DepthIndex entity extractor which terms carry specific domain importance. This improves topic tracking, search boosting, and multi-turn conversations.

---

## Product Names

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: ['DepthIndex Pro', 'DepthIndex Cloud']
  }
})
```

### Example Conversation
- **User**: *"Does DepthIndex Pro run locally?"*
- **AI**: *"No, DepthIndex Pro is our server-side product..."*
- **User**: *"What about the Cloud version?"*

### Result
The assistant understands "the Cloud version" refers to `DepthIndex Cloud` and resolves the query accordingly.

---

## Technical Terms

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: ['TF-IDF', 'Cosine Similarity', 'Vector Index']
  }
})
```

### Example Conversation
- **User**: *"Tell me about TF-IDF"*
- **AI**: *"TF-IDF is a term weighting formula..."*
- **User**: *"Does the Vector Index use it?"*

### Result
Resolves "it" to `TF-IDF` and retrieves documents relating to `Vector Index` scoring.

---

## Commands & Flags

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: ['--dts', '--clean', 'tsup']
  }
})
```

### Example Conversation
- **User**: *"How do I run tsup?"*
- **AI**: *"Run `tsup src/index.ts`..."*
- **User**: *"What does --clean do?"*

### Result
The parser knows `--clean` is a flag configuration of `tsup` and returns tsup clean command documentation.

---

## API Endpoints

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: ['/api/v1/search', '/api/v1/synthesis']
  }
})
```

### Example Conversation
- **User**: *"What are the parameters for /api/v1/search?"*
- **AI**: *"The search endpoint takes `query` and `limit` parameters..."*
- **User**: *"How do I call it via fetch?"*

### Result
Resolves "it" to `/api/v1/search` rather than the general concept of searching.

---

## Code Libraries

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: ['MiniSearch', 'lz-string']
  }
})
```

### Example Conversation
- **User**: *"Does DepthIndex bundle MiniSearch?"*
- **AI**: *"Yes, it bundles MiniSearch for sparse indexing..."*
- **User**: *"Why does it use lz-string?"*

### Result
Maintains context around dependencies and performance parameters.

---

## Combining Multiple Entity Types

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: [
      'DepthIndex Pro',
      'TF-IDF',
      '--clean',
      '/api/v1/search',
      'MiniSearch'
    ]
  }
})
```

### Example Conversation
- **User**: *"I am testing MiniSearch on DepthIndex Pro"*
- **AI**: *"DepthIndex Pro supports custom MiniSearch tuning..."*
- **User**: *"Does it speed up the /api/v1/search call?"*

### Result
Recognizes multiple entity types simultaneously and correctly relates `MiniSearch` optimization to `/api/v1/search` under the context of `DepthIndex Pro`.
