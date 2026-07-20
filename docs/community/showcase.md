# Community Showcase

## Overview
Welcome to the DepthIndex Community Showcase! Here you can find featured documentation portals using on-device AI search, custom layouts, extensions, and translations built by our community.

---

## Submit Your Site

### Requirements
- Must use VitePress with the DepthIndex integration.
- Must be a publicly accessible documentation site.
- Must have stable loading performance on desktop and mobile.

### Submission Process
1. Fork our GitHub repository.
2. Add your site details to the `showcase.md` file.
3. Submit a Pull Request.

---

## Featured Documentation Sites

### VitePress-Plugin Portal by Eldrex
#### Description
The official documentation site for the plugin suite, demonstrating a sleek glassmorphism theme and custom on-device NLU intents.
#### URL
[https://depthindex.vercel.app](https://depthindex.vercel.app)
#### Customizations
- Custom floating action buttons.
- Highly tailored AI personality profile.

### DevDiff Docs by Eldrex
#### Description
Product developer documentation site integrated with Hybrid Search Mode and customized API key configuration inputs.
#### URL
[https://devdiff.vercel.app](https://devdiff.vercel.app)
#### Customizations
- Custom input placeholders.
- Extended entity extraction lists.

---

## Custom Themes

### Glassmorphism Sleek by Eldrex
#### Description
A premium glassmorphism theme with translucent backgrounds, smooth borders, and tailored dark modes.
#### Preview
*Transparent cards layered over light/dark HSL background gradients.*
#### Installation
Add the styling variables to your `custom.css` file.

---

## Community Extensions

### DepthIndex-TTS by Eldrex
#### Description
Adds Text-to-Speech support to the assistant's answers using browser Web Speech APIs.
#### NPM Package
`vitepress-plugin-depthindex-tts`
#### Usage
Import and register under extensions:
```typescript
DepthIndex({
  extensions: [TTS()]
})
```

---

## Community Translations

### Tagalog (Filipino) by DepthIndex Core
#### Completion Percentage
100% complete.
#### How to Use
Specify `tl` in the configuration language settings or switch via the settings modal.
