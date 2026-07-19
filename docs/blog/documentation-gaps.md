---
title: "How to Identify Documentation Gaps with Zero-Result Queries"
description: "Discover content gaps and prioritize documentation updates using failed search queries."
---

# How to Identify Documentation Gaps

The most valuable metric in developer documentation is the **Zero-Result Query**—what developers search for that your documentation does not answer.

Failed searches represent immediate documentation gaps. By tracking these queries, you can prioritize what pages to write next.

## Extracting Zero-Result Events

When a user submits a query that yields a local relevance score below the threshold (0.01), DepthIndex fires a `search_miss` event:

```json
{
  "event": "search_miss",
  "query": "active directory integration",
  "timestamp": "2026-07-19T07:00:00Z"
}
```

## Prioritizing Content Updates

Analyze your zero-result logs weekly to look for trends:
1. **Direct Synonyms**: If developers search for "Active Directory" and your docs only mention "Microsoft AD", add synonyms to your configuration keywords.
2. **Missing Tutorials**: If you see multiple queries for "integration guides", focus your technical writing team on building those step-by-step guides.
3. **Outdated API References**: If developers search for deprecated methods, ensure you redirect those pages to updated resources.
