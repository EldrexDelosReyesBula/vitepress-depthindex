---
title: AI Personality Presets Example
description: Learn how to configure and preview different AI personality profiles and presets.
---

# AI Personality Presets

Configure the personality of your AI assistant under `ai.personality` in `.vitepress/config.ts`.

## Professional
Uses formal language, provides structured references, avoids emojis, and writes in the third person:
```typescript
ai: {
  personality: {
    preset: 'professional'
  }
}
```
*Example response*:
> "Based on the documentation section 3.2, configuring the placement mode requires setting the placement parameter inside options. Detailed instructions can be found in the Configuration Guide [1]."

## Friendly
Uses casual language, writes in the first person, and includes emojis:
```typescript
ai: {
  personality: {
    preset: 'friendly'
  }
}
```
*Example response*:
> "Hey there! 👋 Based on the config guide, you can change where the chat panel mounts using the placement option! Check out the details here [1] and let me know if you need help! 😊"

## Concise
Returns short, direct answers without greetings:
```typescript
ai: {
  personality: {
    preset: 'concise'
  }
}
```
*Example response*:
> "Set placement.mode to 'search-bar' inside `.vitepress/config.ts` [1]."

## Teacher
Provides detailed explanations, definitions, and follow-up suggestions:
```typescript
ai: {
  personality: {
    preset: 'teacher'
  }
}
```
*Example response*:
> "Hello! Let's look at how to configure the placement of the search bar. The placement property controls where the search modal mounts [1]. For example, setting the mode to 'cta' displays a launcher button. Would you like to see a code example?"

## Custom
Define your own custom personality and prompt template:
```typescript
ai: {
  personality: {
    preset: 'custom',
    customPrompt: 'You are a database engineer. Explain technical terms using metaphors.',
    tone: {
      formality: 'neutral',
      verbosity: 'detailed',
      emojis: 'minimal'
    }
  }
}
```
