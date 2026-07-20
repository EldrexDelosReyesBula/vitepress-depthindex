# Conversation Memory Examples

## Basic Follow-Up

### Example Conversation
- **User**: *"What is local search?"*
- **AI**: *"Local search in DepthIndex uses TF-IDF vector ranking directly inside your browser..."*
- **User**: *"How do I configure it?"*
- **AI**: *"To configure local search, add DepthIndex to your plugins config: `DepthIndex({ searchMode: 'on-device' })`..."*

### Behind the Scenes
The NLU engine detects that *"How do I configure it?"* is a follow-up. It references previous concepts, extracts "local search" as the subject, and searches the index for configuration guides relating to local search.

### Configuration
```typescript
DepthIndex({
  synthesis: {
    conversationMemoryDepth: 3
  }
})
```

---

## Multi-Turn Deep Dive

### Example Conversation
- **User**: *"What does the Privacy Firewall do?"*
- **AI**: *"The Privacy Firewall filters out PII (emails, API keys) from queries..."*
- **User**: *"Is it enabled by default?"*
- **AI**: *"Yes, it is active by default in all configurations..."*
- **User**: *"Can I configure custom rules for it?"*
- **AI**: *"Yes, you can configure custom regex patterns under the `privacy` option..."*

### Entity Tracking
Entities tracked: `[ "Privacy Firewall", "PII rules" ]`

### Topic Thread
Topic maintained: `Privacy Firewall`

---

## Custom Entity Example

### Configuration
```typescript
DepthIndex({
  synthesis: {
    customEntities: ['VitePress-Plugin', 'Algolia-DocSearch']
  }
})
```

### Example Conversation
- **User**: *"How is VitePress-Plugin configured?"*
- **AI**: *"The VitePress-Plugin is initialized inside `.vitepress/config.ts`..."*
- **User**: *"Does it support Algolia-DocSearch?"*
- **AI**: *"Yes, it detects Algolia-DocSearch classes and merges matching results..."*

### Result
The assistant boosts search terms related to `VitePress-Plugin` and `Algolia-DocSearch` when they appear in conversation.

---

## Anaphora Resolution

### "What about on Vercel?"
Resolves to: *"How do I deploy DepthIndex on Vercel?"*

### "Can it work offline too?"
Resolves to: *"Does the Privacy Firewall / Search mode work offline?"*

### "How do I configure that?"
Resolves to the configuration parameters of the most recently discussed topic.

### "Show me an example of this"
Displays code snippets or presets relating to the active topic.

---

## Session Timeout

### Configuration
```typescript
DepthIndex({
  synthesis: {
    followUpDetection: {
      sessionTimeout: 600000 // 10 minutes
    }
  }
})
```

### Behavior
If the user leaves the tab inactive for more than 10 minutes, the next query is treated as a fresh entry rather than a follow-up.

---

## Memory Debug

### Enabling Debug Mode
Open developer tools and look at console logs.

### Reading Memory Export
Execute in console:
```javascript
console.log(JSON.stringify(window.DepthIndex.memory.export(), null, 2));
```

### Understanding the Output
```json
{
  "activeTopic": "Local Search",
  "entities": ["local search", "TF-IDF"],
  "historyLength": 2
}
```
Shows active tracking keys.
