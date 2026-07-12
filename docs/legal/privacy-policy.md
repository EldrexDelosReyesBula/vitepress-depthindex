# Privacy Policy

**VitePress DepthIndex** (created by Eldrex Delos Reyes Bula) is built from the ground up to respect user privacy. We are committed to maintaining a strictly offline-first, local search and reasoning model.

---

## 1. Core Privacy Philosophy: Offline-First

By default, DepthIndex processes all searches and answers **entirely on-device**. 
* **Zero Telemetry**: We do not collect, monitor, store, or log any search queries, click behaviors, or usage data.
* **No Remote Analytics**: There are no web beacons, cookies, fingerprinting systems, or remote tracking scripts embedded in the DepthIndex client runtime.
* **No Data Scraping**: Our build-time indexer runs strictly in your local build environment and does not transmit code or documentation content to external servers.

---

## 2. API Key Management & Storage

If you explicitly configure **Hybrid Search Mode** (local search augmented by cloud LLM reasoning), API keys are handled with the highest security precautions:
* **Client-Only Storage**: When you enter an API key for OpenAI, Gemini, or Anthropic in the chat settings panel, the key is saved directly inside your browser's local storage (`window.localStorage`).
* **No Server Storage**: Your keys are never sent to, cached by, or stored on any server controlled by the plugin author or project hosting providers.
* **Direct Transmission**: Requests to cloud LLMs are dispatched directly from the client's browser to the official endpoints (e.g. `https://api.openai.com` or `https://generativelanguage.googleapis.com`) using secure HTTPS connections.

---

## 3. Local Personalization Data

To improve user experiences, DepthIndex tracks recent search history and topic affinity to generate suggested follow-up questions:
* **Storage Location**: This history and affinity weights are saved strictly in `localStorage` inside the user's own browser session.
* **Privacy Toggle**: Users can opt-out of history tracking at any time by toggling the option in the settings panel. If disabled, all historical search and affinity logs are instantly deleted.

---

## 4. GDPR & CCPA Compliance

Because DepthIndex does not gather, transmit, or process any Personally Identifiable Information (PII) on central databases, it is fully compliant with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). All data remains under the absolute control of the end-user on their local machine.

---

## 5. Contact Information

If you have any questions regarding these privacy standards, you can contact the project author:
* **Author**: Eldrex Delos Reyes Bula
* **Email**: eldrexdelosreyesbula@gmail.com
* **Project Repository**: [github.com/EldrexDelosReyesBula/vitepress-depthindex](https://github.com/EldrexDelosReyesBula/vitepress-depthindex)
