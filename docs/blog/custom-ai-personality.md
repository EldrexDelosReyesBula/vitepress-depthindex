---
title: "Creating a Custom AI Personality for Your Docs"
description: "Fine-tune response behavior, system prompts, and tone presets for your documentation assistant."
---

# Creating a Custom AI Personality for Your Docs

By default, DepthIndex answers in a professional, direct developer tone. However, depending on your product, you might want your AI assistant to sound like a supportive teacher, a strict security auditor, or a playful team mascot.

## Personality Presets

DepthIndex supports several built-in personality presets. Configure this in your `config.ts`:

```typescript
DepthIndex({
  personality: {
    preset: 'supportive', // Options: 'professional' | 'supportive' | 'auditor' | 'creative'
  }
})
```

## Custom System Prompts

If the built-in presets do not fit your brand voice, you can write a custom system prompt:

```typescript
DepthIndex({
  personality: {
    systemPrompt: `
      You are Captain Doc, the friendly mascot of the Docker team. 
      You always explain concepts using maritime metaphors and ship terminology. 
      Keep explanations short and use emojis.
    `,
    maxTokens: 500,
    temperature: 0.7,
  }
})
```

## Custom Tone in Action

Here is how the same question (*"What is an image?"*) sounds under different personalities:

* **Professional**: *"An image is a read-only template containing instructions for creating a Docker container."*
* **Maritime Mascot**: *"Ahoy! An image is a complete blueprint of your ship, stored in dry dock ready to float as a live container container! 🚢"*

Tuning your assistant's personality makes interacting with documentation an engaging experience.
