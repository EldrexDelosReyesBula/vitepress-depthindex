---
title: Style & Customization
description: Override styling variables, customize components, and build custom search interfaces.
---

# Community, Customization & Extensibility

Learn how to customize the visual aesthetics of **DepthIndex** components, construct custom client-side search widgets, and contribute to the community.

---

## 1. CSS & Style Customizations

DepthIndex components inherit VitePress's native design tokens (CSS custom properties) by default. To alter styles, you can override these properties or hook into DepthIndex's component class selectors.

### CSS Theme Variables
Add these overrides to your `.vitepress/theme/custom.css` file:

```css
:root {
  /* Override DepthIndex specific color tokens */
  --depthindex-brand-gradient: linear-gradient(135deg, #6366f1, #4f46e5);
  --depthindex-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3);
}

/* Customize the floating trigger button style */
.depthindex-trigger-btn {
  background: var(--depthindex-brand-gradient) !important;
  box-shadow: var(--depthindex-shadow) !important;
  font-family: 'Outfit', sans-serif !important;
}

/* Customizing the glassmorphism modal panels */
.depthindex-modal {
  background-color: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

/* Customizing citation pill badges */
.citation-pill.high-conf {
  background-color: rgba(16, 185, 129, 0.1) !important;
  color: #10b981 !important;
  border-left-color: #10b981 !important;
}
```

### Reference Selectors
* `.depthindex-trigger-btn`: Floating launcher button.
* `.depthindex-modal-overlay`: Search Modal overlay backdrop.
* `.depthindex-modal`: Centered search dialog.
* `.result-item`: Individual fuzzy search result elements.
* `.depthindex-chat-panel`: Chat panel wrapper.
* `.message-bubble`: Dialogue bubbles for user/assistant messages.
* `.citation-pill`: Pill button linking back to documentation sources.

---

## 2. Programmatic Inline Search Widget

If you want to disable the default search modal and float launcher entirely to render a custom inline search input (e.g., inside your landing page), you can build it using the Client SDK.

### Example: Custom Vue Search Component
Disable the default launcher in `.vitepress/config.ts`:
```typescript
DepthIndex({
  ui: {
    showFloatingButton: false,
    enableModal: false
  }
})
```

Create a custom Vue component, e.g. `docs/components/InlineSearch.vue`:
```vue
<template>
  <div class="custom-search">
    <input 
      v-model="query" 
      placeholder="Type keywords to search..." 
      class="search-input"
    />
    
    <div v-if="results.length > 0" class="results-list">
      <div v-for="res in results" :key="res.chunk.id" class="result-card">
        <h5>
          <a :href="res.chunk.url">{{ res.chunk.pageTitle }} &gt; {{ res.chunk.heading }}</a>
          <span class="badge">{{ Math.round(res.score * 100) }}% match</span>
        </h5>
        <p>{{ res.chunk.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { DepthIndexEngine } from 'vitepress-plugin-depthindex/client';
import { fetchAndDecompressIndex } from 'vitepress-plugin-depthindex/client';

const query = ref('');
const results = ref([]);
const engine = new DepthIndexEngine();

onMounted(async () => {
  // Fetch and load index
  const indexData = await fetchAndDecompressIndex('/assets/depth-index.json.gz');
  engine.setIndex(indexData);
});

watch(query, (newVal) => {
  if (!newVal.trim()) {
    results.value = [];
    return;
  }
  // Run query retrieval (BM25 + TF-IDF)
  results.value = engine.search(newVal, 5);
});
</script>

<style scoped>
.custom-search { max-width: 500px; margin: 20px auto; }
.search-input { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc; }
.result-card { padding: 12px; margin-top: 8px; border-radius: 6px; border: 1px solid #eee; }
.badge { float: right; font-size: 11px; color: green; }
</style>
```

---

## 3. Contributing & Code Repository

VitePress DepthIndex is open-source. You can join the development on GitHub:

* **Official Repository**: [github.com/EldrexDelosReyesBula/vitepress-depthindex](https://github.com/EldrexDelosReyesBula/vitepress-depthindex)
* **Production Live Site**: [depthindex.vercel.app](https://depthindex.vercel.app/)

### Release Checklist
Before submitting a Pull Request, please ensure:
1. All unit tests pass: `npm run test`
2. The package builds cleanly: `npm run build`
3. Exclusions for dev tools (like `.devdiff`) are active.
