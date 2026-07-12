# Security Policy

We take the security and integrity of **VitePress DepthIndex** seriously. This policy outlines our security practices, scanning processes, and instructions for reporting vulnerabilities.

---

## 1. Security Safeguards

* **Index Exclusions**: The indexer automatically ignores hidden system directories (folders starting with `.`, such as `.git/`, `.changeset/`, `.devdiff/`, and `.vscode/`) during build crawling. This prevents secrets or internal configurations from being accidentally compiled into your documentation search index.
* **Input Sanitization**: Users' queries and LLM generated results are rendered inside Vue using HTML-escaped templates to mitigate Cross-Site Scripting (XSS) risks.
* **Safe Local Storage**: API keys provided by the user are stored in the client browser's `localStorage` and sent directly to target API endpoints over secure HTTPS channels, bypassing intermediary servers.

---

## 2. Reporting a Vulnerability

If you identify a security vulnerability or bug in the plugin, please report it directly to the author instead of raising a public GitHub issue:
* **Contact Email**: eldrexdelosreyesbula@gmail.com
* **Information to Include**:
  - Detailed description of the vulnerability.
  - Step-by-step instructions (or proof of concept script) to replicate the issue.
  - Potential impact of the bug.

---

## 3. Response Process

* **Acknowledgement**: We aim to acknowledge your vulnerability report within **48 hours**.
* **Fix Timeline**: We work to resolve validated issues and publish patches on npm within **7 days** of verification.
* **Advisory**: Once the fix is published, we will release a security advisory detailing the fix and acknowledging the reporter.
