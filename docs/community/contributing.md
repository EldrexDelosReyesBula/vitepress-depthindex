# Contributing Guide

Thank you for choosing to contribute to **VitePress DepthIndex**! We welcome bug reports, documentation improvements, issue resolutions, and feature requests.

---

## 1. Local Development Setup

To set up the development environment on your local machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/EldrexDelosReyesBula/vitepress-depthindex.git
   cd vitepress-depthindex
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the package**:
   ```bash
   npm run build
   ```
4. **Launch documentation site locally**:
   ```bash
   npm run docs:dev
   ```

---

## 2. Code Guidelines & Standards

* **TypeScript**: Use strict type annotations (we compile with `"strict": true` configured in `tsconfig.json`).
* **Framework Dependencies**: Keep peer dependencies (like Vue and VitePress) externalized.
* **Security & Privacy**: 
  - Never add remote telemetry, analytics, tracking cookies, or network requests that leak user queries.
  - Do not commit local development folders (like `.devdiff`) to Git.
  - Use `Object.create(null)` for string-keyed object maps to prevent prototype collisions.

---

## 3. Running Verification Tests

Before submitting any code changes, you must verify that all unit tests and stress tests pass:

```bash
# Execute all vitest tests
npm run test
```

Ensure that the average search query latency in the stress test remains well below **30 milliseconds** on your machine.

---

## 4. Submitting a Pull Request

1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Implement your changes, add tests where applicable, and run the verification tests.
3. Commit and push your branch to GitHub.
4. Open a Pull Request (PR) against the `main` branch.
5. Provide a clear description in your PR of what changes were made and how they were tested.
