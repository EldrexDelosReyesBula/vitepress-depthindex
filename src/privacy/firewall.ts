export class PrivacyFirewall {
  static readonly PROTECTED_KEYS = [
    'depthindex-cloud-config', 'depthindex-api-key',
    'depthindex-openai-key', 'depthindex-gemini-key',
    'depthindex-anthropic-key', 'depthindex-user-settings',
    'depthindex-language', 'depthindex-theme',
    'depthindex-personalization',
  ];
  
  static validatePayload(payload: any): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    const json = JSON.stringify(payload).toLowerCase();
    for (const key of this.PROTECTED_KEYS) {
      if (json.includes(key.toLowerCase())) violations.push(`Protected key: ${key}`);
    }
    if (/[\w.-]+@[\w.-]+\.\w+/.test(json)) violations.push('Email detected');
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(json)) violations.push('Phone detected');
    if (/sk-[a-zA-Z0-9]{20,}/.test(json)) violations.push('API key detected');
    return { valid: violations.length === 0, violations };
  }
  
  static getAccessibleAnalytics(): string[] {
    return ['total_queries', 'top_queries_anonymized', 'zero_result_queries',
      'feedback_ratio', 'page_search_counts', 'citation_click_counts', 'error_categories'];
  }
  
  static getRestrictedData(): string[] {
    return ['individual_user_queries', 'user_api_keys', 'user_cloud_config',
      'user_personalization_data', 'user_chat_history', 'user_ip_addresses'];
  }
}
