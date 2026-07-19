---
title: Hybrid Mode Example
description: Configure hybrid search to combine local-first index matching with cloud-based AI answer synthesis.
---

# Hybrid Mode

## Configuration
To configure hybrid search, set `searchMode: 'hybrid'` and add your AI provider settings under `cloudAPI` in `.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'hybrid',
        cloudAPI: {
          provider: 'gemini',
          model: 'gemini-1.5-flash'
        }
      })
    ]
  }
});
```

## Environment Variables
To prevent exposing secret keys in source control, inject your API token using the `VITE_DEPTHINDEX_CLOUD_API_KEY` environment variable during the build process:
```bash
# Set locally
export VITE_DEPTHINDEX_CLOUD_API_KEY=your_gemini_api_key_here
```
DepthIndex detects this key automatically, locking the user settings UI to protect credentials.

## Behavior
When a user submits a query in hybrid mode:
1. **Local Retrieval**: The client-side search engine queries the local index to find the top 3-5 most relevant chunks.
2. **Scrubbing**: The Privacy Firewall scrubs PII (such as email addresses and phone numbers) from the query and chunks.
3. **Cloud Call**: The cleaned query and chunks are sent to the cloud model to generate a response.
4. **Offline Fallback**: If the user is offline or the cloud API fails, DepthIndex falls back to local template-based synthesis silently.

## Testing
To test the hybrid search:
1. Open the documentation site in your browser.
2. Open Developer Tools and go to the **Network** tab.
3. Submit a search query in the chat panel.
4. Verify that a request is made to the cloud provider's API (e.g. `googleapis.com` for Gemini) and that the response is generated successfully.
5. Disconnect your internet connection and verify that the engine falls back to local template answers without crashing.
