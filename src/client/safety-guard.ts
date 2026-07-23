// src/client/safety-guard.ts

export interface SafetyCheckResult {
  type: 'crisis_self_harm' | 'violence' | 'child_safety';
  blockQuery: boolean;
  response: string;
  log: boolean;
}

export class SafetyGuard {
  
  // HIGH PRIORITY: Self-harm and crisis patterns
  private readonly CRISIS_PATTERNS = [
    /\b(kill|hurt|harm)\s+(myself|me)\b/i,
    /\b(end my life|end it all|suicide|suicidal)\b/i,
    /\b(want to die|don't want to (live|be here|exist)|no reason to live)\b/i,
    /\b(self[-\s]?harm|cut myself|cutting)\b/i,
    /\b(goodbye (forever|cruel world)|final goodbye)\b/i,
    /\b(i'?m going to (end|kill))\b/i,
    /\b(can'?t (go on|take it|do this) anymore)\b/i,
  ];

  // HIGH PRIORITY: Violence toward others
  private readonly VIOLENCE_PATTERNS = [
    /\b(kill|hurt|harm|attack|shoot|stab)\s+(someone|others|people|them|him|her)\b/i,
    /\b(mass (shooting|murder|killing)|terrorist|bomb)\b/i,
    /\b(how to (kill|murder|assassinate|make a bomb))\b/i,
  ];

  // Child safety
  private readonly CHILD_SAFETY_PATTERNS = [
    /\b(child (abuse|exploitation|pornography|trafficking))\b/i,
    /\b(sexual(ly)? (abuse|exploit|assault) (a |with )?(child|minor|teen))\b/i,
  ];

  /**
   * Check if a query contains crisis or dangerous content.
   * Returns safety response if needed, null if query is safe.
   */
  check(query: string): SafetyCheckResult | null {
    if (!query) return null;

    // Crisis — self harm
    for (const pattern of this.CRISIS_PATTERNS) {
      if (pattern.test(query)) {
        return {
          type: 'crisis_self_harm',
          blockQuery: true,
          response: this.getCrisisResponse(),
          log: true,
        };
      }
    }

    // Violence
    for (const pattern of this.VIOLENCE_PATTERNS) {
      if (pattern.test(query)) {
        return {
          type: 'violence',
          blockQuery: true,
          response: this.getViolenceResponse(),
          log: true,
        };
      }
    }

    // Child safety
    for (const pattern of this.CHILD_SAFETY_PATTERNS) {
      if (pattern.test(query)) {
        return {
          type: 'child_safety',
          blockQuery: true,
          response: this.getChildSafetyResponse(),
          log: true,
        };
      }
    }

    return null;
  }

  /**
   * Crisis response — compassionate, helpful, with real resources.
   */
  private getCrisisResponse(): string {
    return `I'm really concerned about what you've shared. You're not alone — there are people who care and want to help.

**Please reach out to a crisis helpline:**

- **🇺🇸 US:** Call or text **988** (Suicide & Crisis Lifeline)
- **🇬🇧 UK:** Call **111** or text **SHOUT** to **85258**
- **🇵🇭 Philippines:** Call **1553** (Hopeline) or **0917-558-4673**
- **🌍 International:** [Find your local helpline](https://findahelpline.com)

**If you're in immediate danger, please call emergency services (911/999/117).**

I'm an AI assistant and I can't provide counseling, but I care about your safety. Please talk to a real person who can help.

Is there anything about the documentation I can help you with when you're ready?`;
  }

  private getViolenceResponse(): string {
    return `I can't help with that request. If you're experiencing thoughts of harming others, please speak with a mental health professional or call a crisis helpline.

If this is an emergency, call emergency services immediately.`;
  }

  private getChildSafetyResponse(): string {
    return `I can't help with this request. Child safety is critically important. If you have concerns about a child's safety, please contact local authorities or child protective services.

If this is an emergency, call emergency services immediately.`;
  }
}
