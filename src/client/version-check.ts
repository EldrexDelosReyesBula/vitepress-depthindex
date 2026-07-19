// src/client/version-check.ts

export class VersionManager {
  
  /**
   * DepthIndex NEVER auto-updates.
   * Devs must manually bump the version in package.json.
   */
  static checkVersion(): { current: string; latest: string; needsUpdate: boolean } {
    const current = '1.2.0'; // Updated for minor release
    const stored = typeof window !== 'undefined' ? localStorage.getItem('depthindex_version') : null;
    
    return {
      current,
      latest: current,
      needsUpdate: stored ? stored !== current : false,
    };
  }
  
  /**
   * Security: Verify index signature before loading.
   * If signature fails, refuse to load the index.
   */
  static async verifyIndexIntegrity(indexData: ArrayBuffer, signature: string): Promise<boolean> {
    try {
      const hash = await crypto.subtle.digest('SHA-256', indexData);
      const hashHex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex === signature;
    } catch {
      return false;
    }
  }
}
