# Conversation Memory & Context

## Overview
DepthIndex includes a robust, local-first conversation memory system. It allows the AI assistant to remember details from previous turns, resolve pronouns (like "it", "this", or "that"), and maintain a continuous flow during multi-turn documentation investigations.

---

## How Memory Works

### Message Storage
Messages are securely stored in either `localStorage` or `indexedDB` (configurable). Only message text, metadata, and extracted entities are persisted.

### Entity Extraction
During a conversation, DepthIndex parses user queries to extract key entities such as API parameters, settings fields, code symbols, and product names.

### Topic Tracking
The system monitors the subject matter of the last few turns. If the topic shifts drastically, the search index resets context boosting to align with the new subject.

### Intent Detection
DepthIndex uses on-device pattern matching or optional cloud NLU to identify whether the user is asking a follow-up question, seeking a code example, or requesting a summary.

---

## Anaphora Resolution

### How "it", "this", "that" resolve
Anaphora resolution is the process of mapping pronouns to previously discussed concepts. If you ask:
1. *"How do I configure the search bar?"*
2. *"Can I disable it?"*

DepthIndex recognizes that "it" refers to "the search bar".

### Examples
- **User**: *"What is Hybrid Mode?"* → AI explains hybrid search.
- **User**: *"How do I enable it?"* → AI provides configuration instructions for enabling Hybrid Mode.

### Limitations
- Multi-concept confusion: If you mention three different settings in one query, "it" in the next turn might resolve to the most recently styled noun.
- Long gaps: If the session times out, the relationship between concepts is cleared.

---

## Memory Configuration

Configure conversation memory under the `synthesis` options:

### Memory Depth
Determines how many previous turns of context are retained in the memory window.
```typescript
synthesis: {
  conversationMemoryDepth: 5 // Keep last 5 turns
}
```

### Session Timeout
The period of inactivity (in milliseconds) before the conversation memory is cleared.
```typescript
synthesis: {
  followUpDetection: {
    sessionTimeout: 1800000 // 30 minutes
  }
}
```

### Custom Entities
You can instruct the entity parser to track custom terms specific to your library:
```typescript
synthesis: {
  customEntities: ['VitePress', 'DepthIndex', 'Algolia']
}
```

---

## Context Building

### What Gets Sent to AI
When a query is dispatched:
1. The current user query.
2. Resolved context and entities from the memory stack.
3. The top $N$ matching documentation pages from the local vector index.

### Context Window Limits
DepthIndex optimizes the payload size to avoid blowing past API token limits on cloud models or running out of memory on local devices.

### Recency Weighting
Older messages are given less weight in relevance calculations.

---

## Conversation Boosting

### Topic-Based Search Boost
When a topic is active, search terms matching that topic receive a search score boost in successive queries.

### Boost Factor
Configure the boost multiplier (e.g., `1.2` or `1.5`) in search options:
```typescript
search: {
  conversationBoost: true,
  boostFactor: 1.3
}
```

---

## Debugging Memory

### Debug Mode
Enable debug logs in your console to view active entities and memory states:
```typescript
// Enable verbose logs
DepthIndex({
  ui: {
    customClass: 'di-debug'
  }
})
```

### Memory Export
Export conversation history as JSON to review intent classification:
```javascript
window.DepthIndex.exportHistory();
```

### Console Inspection
Inspect the active memory engine directly:
```javascript
console.log(window.DepthIndex.memory.getEntities());
```

---

## Configuration Reference
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `synthesis.conversationMemoryDepth` | `number` | `4` | Number of dialog turns kept. |
| `synthesis.customEntities` | `string[]` | `[]` | List of terms to always treat as entities. |
| `search.conversationBoost` | `boolean` | `true` | Enables topic boosting. |

---

## Limitations
- **Offline Limits**: Anaphora resolution performs best when connected to a cloud API or a larger local LLM model. Extremely small local transformers may fail complex entity mappings.
- **Privacy Rules**: To ensure PII compliance, no personal information (names, emails) is saved in the memory system.
