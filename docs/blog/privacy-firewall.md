---
title: "Understanding the DepthIndex Privacy Firewall"
description: "An in-depth look at client-side PII sanitization and telemetry filtering mechanisms."
---

# Understanding the DepthIndex Privacy Firewall

Even in Hybrid or Cloud search modes, where queries must be processed externally, DepthIndex enforces privacy checks using the **Privacy Firewall**.

The Privacy Firewall is a client-side middleware that filters and sanitizes data before it leaves the browser.

## PII Sanitization

Before sending a search query to a cloud API (like OpenAI or Gemini), the query is evaluated by our `PIIDetector` engine. The engine scrubs sensitive data:

* **Email Addresses**: `user@company.com` becomes `[EMAIL]`.
* **API Keys**: String patterns matching cloud credentials (like `sk-...` keys) are redacted.
* **Phone Numbers**: Numerical sequences matching telephone patterns are stripped.

## Telemetry Filtering

When logging telemetry to your custom analytics endpoint, the Privacy Firewall ensures only aggregate, anonymous metadata is sent:

* **Allowed Metrics**: `total_queries`, `citation_clicks`, `mode_switches`, `response_time_ms`.
* **Blocked Data**: Raw query strings, search history, user IP addresses, browser fingerprints.

This ensures you gather actionable feedback on documentation performance without collecting personal user data.
