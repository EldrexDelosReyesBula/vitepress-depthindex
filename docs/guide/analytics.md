---
title: Analytics & Insights
description: Learn how to track search queries, citation clicks, and user feedback in a privacy-compliant way.
---

# Analytics & Insights

## Overview
VitePress DepthIndex includes a privacy-compliant analytics system. It allows site owners to track search trends, documentation coverage gaps, and helpfulness feedback without exposing user data or violating privacy regulations.

## What Analytics Track
The engine records events inside the following categories:

### Search Queries (Anonymized)
Records the text of queries to identify common search terms. The firewall automatically scrubs PII (such as emails, keys, and phone numbers) from query strings before recording them.

### Citation Clicks
Tracks which citations (e.g. clicking `[1]`) users select. This helps site owners identify which sections of the documentation are most helpful.

### Feedback Scores
Records helpfulness ratings (thumbs up/down) submitted by users in the chat panel to measure answer quality.

### Error Occurrences
Logs error categories (such as `CLOUD_API` or `INDEX_LOAD` failures) to help developers troubleshoot deployment issues.

### Session Data
Tracks basic session statistics (such as session length and page navigation flows) to measure overall user engagement.

## What is NEVER Tracked
To ensure strict privacy compliance, the analytics system never logs:
- Raw user API keys or configuration options.
- Individual user chat transcripts or history.
- IP addresses, device names, or geolocations.

## Privacy Firewall
Before logging any telemetry event, the client-side `Privacy Firewall` validates the payload. It blocks any events containing email addresses, API key prefixes, or phone numbers, and restricts variables to approved fields:
- `total_queries`
- `top_queries_anonymized`
- `zero_result_queries`
- `feedback_ratio`
- `page_search_counts`
- `citation_click_counts`
- `error_categories`

## Enabling Analytics
To enable analytics tracking, configure the `analytics` options in `.vitepress/config.ts`:
```typescript
analytics: {
  enabled: true,
  storage: 'indexeddb',
  trackedCategories: ['search', 'click', 'feedback', 'error']
}
```

## Storage Options
Select where to store analytics data locally before flushing:
- **`indexeddb`**: Stores logs in an IndexedDB database. Recommended for batch updates.
- **`localstorage`**: Stores logs in `localStorage`.
- **`memory`**: Holds logs in memory; data is lost when the page is closed.
- **`none`**: Disables local logging entirely.

## Viewing the Dashboard
If configured, site owners can view analytics directly within the admin interface. The dashboard displays graphs showing query volumes, popular topics, and error occurrences.

## Understanding the Data

### Documentation Gaps
Look at zero-result queries (searches that returned no matching documents). This helps you identify topics that are missing from your documentation.

### Popular Topics
Identify the most searched terms to see what features or APIs users look for most often.

### User Satisfaction
Monitor feedback trends to track satisfaction scores across different topics.

## Exporting Data
You can export analytics data as a structured CSV or JSON file from the settings panel, allowing you to run custom reports.

## Clearing Analytics
Users can clear their local analytics logs at any time by clicking "Clear Telemetry" in their browser settings.

## External Analytics Integration
You can forward anonymized telemetry events to external analytics platforms:

### Google Analytics
Send events to Google Analytics via custom gtag calls:
```javascript
window.gtag('event', 'depthindex_search', { query: anonymizedQuery });
```

### Plausible
Route events to a self-hosted Plausible instance:
```javascript
window.plausible('Search', { props: { query: anonymizedQuery } });
```

### Self-Hosted
Configure a custom endpoint in your configuration to send events directly to your own server:
```typescript
analytics: {
  externalEndpoint: 'https://analytics.mycompany.com/api/events',
  externalHeaders: {
    'Authorization': 'Bearer my-token'
  }
}
```

## Privacy Notice Banner
If analytics are enabled, you can display a GDPR-compliant privacy notice banner in the UI. Users must consent to tracking before any events are recorded:
```typescript
privacy: {
  showNotice: true,
  privacyPolicyUrl: 'https://mycompany.com/privacy'
}
```
