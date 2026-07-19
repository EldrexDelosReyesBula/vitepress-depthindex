---
title: Personalization
description: Understand personalization settings, history limits, and data privacy options.
---

# Personalization

## Overview
VitePress DepthIndex supports local personalization features that tailor the search and chat experience to each user. By tracking search trends and viewed pages, it generates context-aware suggested questions and helps users find relevant content faster.

## Default: OFF
To prioritize privacy, personalization is **disabled by default** (`personalization.enabled = false` in `DEFAULT_OPTIONS`). No query tracking or profile logging occurs unless you explicitly enable this feature or the user opts in.

## When to Enable
Consider enabling personalization if:
- You are deploying a hybrid or cloud-only documentation portal where users run multi-turn sessions.
- You want to display personalized suggested questions when users open the search box or chat panel.
- Users are likely to search for related concepts across multiple sessions.

## What Data is Stored
When personalization is enabled, all data is stored locally in the user's browser (using `localStorage` or `indexedDB` based on configuration):
- Anonymized query strings (up to `maxHistory` limit).
- Page URL visits and view counts.
- Calculated topic affinity weights.
No personal identifiers, IP addresses, or location data are stored.

## Topic Affinity Tracking
As the user navigates your documentation, DepthIndex increments weight values for specific topics (derived from page frontmatter categories). If a user spends time reading API guides, the system boosts API-related content in their search results.

## Query History
The engine retains a query history list up to the configured limit (default: 20 entries):
```typescript
personalization: {
  enabled: true,
  storage: 'localStorage',
  maxHistory: 20 // Deletes oldest entries when exceeded
}
```
Users can view and clear their history directly from the settings panel.

## Suggested Questions
Personalization data drives the suggestion engine. When a user opens the chat panel, DepthIndex generates suggested questions based on:
1. The currently viewed page's headings.
2. The user's search history.
3. Their top topic affinity categories.

## Opt-Out
Users can disable personalization and history tracking at any time by toggling the history option in the chat panel settings. Disabling the option stops all data recording immediately and switches the panel to generic suggestions.

## Data Clearing
To delete all stored personalization records, users can click the "Clear Profile Data" button in the settings panel. This deletes all search history and topic affinity scores from browser storage immediately.

## Privacy Considerations
Because all personalization features run locally in the browser, data never leaves the user's device. No user profiles are shared with search engines, analytics companies, or AI cloud providers.

## Best with Cloud AI
While personalization works in all modes, it is especially useful when combined with cloud AI (hybrid or cloud modes). The personalization history can be passed as context to the cloud model, allowing it to generate highly tailored responses for each user.
