---
title: AI Personality & Tone
description: Configure presets, system prompts, custom tone values, and behavior settings in VitePress DepthIndex.
---

# AI Personality & Tone

## Overview
VitePress DepthIndex allows you to configure the personality, tone, and behaviors of your conversational assistant. These configurations apply to answer generation in hybrid and cloud modes, translating into system prompt directives sent to your cloud AI provider.

## Presets
DepthIndex includes four pre-built personality profiles:

### Professional
- **Tone**: Formal, reserved, balanced verbosity, zero emojis, third-person perspective.
- **Behavior**: Always cite sources, suggest follow-up questions, admit uncertainty when query matching scores are low, offer elaborations.

### Friendly
- **Tone**: Casual, enthusiastic, balanced verbosity, moderate emoji usage, first-person perspective.
- **Behavior**: Warm greetings, suggest follow-ups, admit uncertainty.

### Concise
- **Tone**: Neutral, reserved, highly concise verbosity, zero emojis, third-person perspective.
- **Behavior**: Always cite sources, no follow-up suggestions, no greetings.

### Teacher
- **Tone**: Neutral, balanced enthusiasm, detailed explanations, minimal emoji usage, first-person perspective.
- **Behavior**: Warm greetings, suggest follow-up exercises, admit uncertainty.

### Custom
Allows you to configure your own tone and behavior values manually.

## Tone Options
Customize individual tone values under `ai.personality.tone`:

### Formality
- `casual`: Uses conversational, laid-back language.
- `neutral`: Balanced, standard language.
- `formal`: Strictly professional language.

### Enthusiasm
- `reserved`: Calm and objective responses.
- `balanced`: Default helpful tone.
- `enthusiastic`: High energy and encouraging responses.

### Verbosity
- `concise`: Returns short, direct answers.
- `balanced`: Standard paragraphs.
- `detailed`: Includes background explanations and examples.

### Emoji Usage
- `none`: Disables emojis.
- `minimal`: Limit to 1 emoji per message.
- `moderate`: Adds emojis to headings and lists.

### First Person
- `true`: Writes from the perspective of "I" or "We".
- `false`: Writes in the third person.

## Behavior Options
Configure operational behaviors under `ai.personality.behavior`:
- **`alwaysCite`**: `boolean` — Force the AI to include inline citations for every assertion.
- **`suggestFollowUps`**: `boolean` — Appends 2-3 follow-up questions at the end of each message.
- **`admitUncertainty`**: `boolean` — If relevance scores are below a threshold, the assistant admits it does not know instead of guessing.
- **`offerElaboration`**: `boolean` — Asks if the user wants details on related sections.
- **`greeting`**: `'warm' | 'brief' | 'none'` — Selects the greeting style for the initial message.

## Custom System Prompt
Inject a custom system prompt to define a unique personality for your assistant:
```typescript
ai: {
  personality: {
    preset: 'custom',
    customPrompt: 'You are a technical support agent for a database engine. Write all your answers in the style of a retro computing console.'
  }
}
```

## Logo Customization
Add custom branding to the welcome screen and header:
```typescript
ai: {
  logo: {
    src: '/assets/custom-mascot.png',
    alt: 'Mascot Logo',
    size: 'md',
    position: 'both' // Displays logo in both panel header and welcome screen
  }
}
```

## Examples
For detailed configuration examples, check out the [AI Personality Presets Example Page](/examples/personality-preset).
