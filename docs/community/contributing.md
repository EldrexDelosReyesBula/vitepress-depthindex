---
title: Contributing
description: Contribution guidelines, development setups, and coding standards for VitePress DepthIndex.
---

# Contributing

Thank you for your interest in contributing to VitePress DepthIndex! We welcome pull requests, bug reports, and suggestions.

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](/community/code-of-conduct). Please report any violations or unacceptable behaviors to `eldrexdelosreyesbula@gmail.com`.

## Getting Started
- Search existing issues and pull requests to ensure your contribution isn't already being worked on.
- If you find a bug or have a feature request, please open a new issue describing the problem or proposal.

## Development Setup
To set up a local development environment:
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/EldrexDelosReyesBula/vitepress-depthindex.git
   cd vitepress-depthindex
   ```
2. Install the dependencies using pnpm:
   ```bash
   pnpm install
   ```
3. Run the compiler in watch mode:
   ```bash
   pnpm run dev
   ```
4. Start the documentation server:
   ```bash
   pnpm run docs:dev
   ```

## Pull Requests
- Create a new branch for your changes (e.g. `feat/custom-icons`).
- Ensure all tests pass and there are no TypeScript compilation errors.
- Commit your changes using descriptive, conventional commit messages.
- Submit a pull request to the `main` branch, explaining the changes and linking to relevant issues.

## Coding Standards
- Follow the existing codebase structure and styles.
- Maintain documentation integrity: do not modify existing comments or docstrings unless requested.
- Ensure all public functions and configuration interfaces include JSDoc comments.

## Testing
We use Vitest for unit testing. Write tests for any new features or bug fixes:
- Run all tests:
  ```bash
  pnpm run test
  ```
- Run tests in watch mode:
  ```bash
  pnpm run test:watch
  ```

## Documentation
- If your pull request introduces new configurations or API changes, update the relevant files in the `docs` folder.
- Ensure all files build correctly before submitting a PR:
  ```bash
  pnpm run docs:build
  ```
