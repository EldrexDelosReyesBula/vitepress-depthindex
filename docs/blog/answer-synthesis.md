---
title: "How Answer Synthesis Works: From Search Results to Natural Responses"
description: "An in-depth look at how search matches are clustered, parsed, and formatted into readable markdown answers."
---

# How Answer Synthesis Works

Searching is only half the battle. The core feature of DepthIndex is **Answer Synthesis**—taking a set of matching search results and combining them into a natural, cohesive, and easy-to-read answer.

Here is the exact pipeline DepthIndex uses to transform raw search blocks into user responses:

    ```mermaid
    flowchart TD
        A[User submits query] --> B[Query Intent Analysis (NLU)]
        B --> C[Document Clustering]
        C --> D[Content Extraction]
        D --> E[Synthesis & Citation]
        E --> F[Rich Text Render]

        B -->|Classifies query type| B1[Definition - What is]
        B -->|Classifies query type| B2[Step-by-step - How to]
        B -->|Classifies query type| B3[Solution - Troubleshooting]

        C -->|Groups search results by| C1[Topic]
        C -->|Groups search results by| C2[Headings]
        C -->|Groups search results by| C3[Document proximity]

        D -->|Extracts sentences containing| D1[Key query terms]
        D -->|Discards| D2[Raw tables]
        D -->|Discards| D3[Code block boundaries]
        D -->|Discards| D4[SVGs]

        E -->|Builds| E1[Answer structure]
        E -->|Inserts| E2[Superscript tags matching citations at bottom]

        F -->|Converts| F1[Inline markdown]
        F -->|Converts| F2[Links]
        F -->|Converts| F3[Tables]
        F -->|Converts| F4[Blockquotes]
        F -->|To| F5[Clean HTML ready for display in Vue]
```


## Intent-Driven Templates

Our local synthesizer relies on intent classification:
* **How-To Intent**: Synthesizes a numbered list of steps extracted from matching sections.
* **Definition Intent**: Focuses on the first sentence of highly scored paragraphs, placing examples in a secondary block.
* **Troubleshooting Intent**: Formats results as *Problem* and *Solution* cards.

By tailoring the answer structure to the user's intent, DepthIndex delivers an automated experience that feels handcrafted.
