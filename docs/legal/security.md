---
title: Security Policy
description: Security guidelines, vulnerability reporting, and supported version references.
---

# Security Policy

## Reporting
We take the security of VitePress DepthIndex seriously. If you find a security vulnerability or data leak:
- **Do not** report it publicly in GitHub issues.
- Email a description of the issue to the maintainer: `eldrexdelosreyesbula@gmail.com`.
- We will acknowledge your report within 48 hours and coordinate a fix.

## Measures
We use multiple layers of security to protect user configurations:
- **PII Firewall**: Client-side filters scrub personal data (emails, keys, and phone numbers) from queries before they are sent to external APIs.
- **ECDSA Signatures**: Build manifests are verified using ECDSA cryptographic signatures to prevent loading compromised index files.
- **Prefix Sandboxing**: Stored variables are isolated from other scripts running on the page to prevent cross-site scripting (XSS) leaks.

## Supported Versions
Security updates are backported to the following active versions:
| Version Range | Status |
| :--- | :--- |
| **`v1.1.6`** | Supported (Current stable release) |
| **`v1.1.x`** | Supported |
| **`v1.0.x`** | Deprecated (Upgrade recommended) |

## Disclosure
Once a patch has been released, we will publish a security advisory detailing the vulnerability and acknowledge the reporter in the release notes.
