# Custom Component Injection

## Overview
DepthIndex provides total design freedom by exposing reusable Vue components and a headless engine composable (`useDepthIndex`) so you can replace or customize any part of the UI.

## Available Components

Import individual components directly:

```typescript
import {
  DepthIndexPanel,
  DepthIndexSearchBar,
  DepthIndexFloatingButton,
  DepthIndexBanner,
  DepthIndexModal,
  DepthIndexAskButton,
} from 'vitepress-plugin-depthindex/components';
```

- `DepthIndexPanel`
- `DepthIndexSearchBar`
- `DepthIndexFloatingButton`
- `DepthIndexBanner`
- `DepthIndexModal`
- `DepthIndexBottomSheet`
- `DepthIndexChatMessage`
- `DepthIndexCitation`
- `DepthIndexCodeBlock`
- `DepthIndexSettingsPanel`
- `DepthIndexLogo`
- `DepthIndexAskButton`

## Component Interface

Custom components can be injected via the `components` option:

```typescript
DepthIndex({
  components: {
    FloatingButton: MyCustomFloatingButton,
    Panel: MyCustomChatPanel,
    Logo: MyCustomLogo,
  },
})
```

## Headless Mode

Build your own UI completely from scratch while relying on DepthIndex as a headless search and AI engine:

```vue
<template>
  <div class="my-custom-ui">
    <input v-model="query" @keydown.enter="depthIndex.search(query)" placeholder="Search..." />
    <div v-for="msg in depthIndex.messages" :key="msg.id">
      <p>{{ msg.content }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDepthIndex } from 'vitepress-plugin-depthindex';

const depthIndex = useDepthIndex();
const query = ref('');
</script>
```
