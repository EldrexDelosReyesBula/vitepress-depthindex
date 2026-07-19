export interface DeviceProfile {
  tier: 'low' | 'medium' | 'high';
  ram: number;
  cpuCores: number;
  gpu: 'none' | 'basic' | 'dedicated';
  network: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi';
  isMobile: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
}

export interface OptimizedConfig {
  vectorPrecision: 'int8' | 'float16' | 'float32';
  maxResults: number;
  chunkSize: number;
  cacheSize: number;
  animations: boolean;
  preloadPages: number;
  workerThreads: number;
  lazyDecompress: boolean;
  virtualScroll: boolean;
}

export class DeviceAdapter {
  private profile: DeviceProfile;
  
  constructor() {
    this.profile = this.detectDevice();
    this.applyOptimizations();
  }
  
  /**
   * Auto-detect device capabilities
   */
  private detectDevice(): DeviceProfile {
    const ram = typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory || 4) : 4;
    const cpuCores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
    const connection = typeof navigator !== 'undefined' ? ((navigator as any).connection) : null;
    
    // Determine tier
    let tier: 'low' | 'medium' | 'high';
    if (ram <= 2 || cpuCores <= 2) {
      tier = 'low';
    } else if (ram <= 4 || cpuCores <= 4) {
      tier = 'medium';
    } else {
      tier = 'high';
    }
    
    // Check GPU
    let gpu: 'none' | 'basic' | 'dedicated' = 'basic';
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer?.includes('SwiftShader') || renderer?.includes('llvmpipe')) {
              gpu = 'none';
            } else {
              gpu = 'dedicated';
            }
          }
        } else {
          gpu = 'none';
        }
      } catch (e) {
        gpu = 'none';
      }
    }
    
    const prefersReducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
      
    const prefersDarkMode = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
      
    const isMobile = typeof navigator !== 'undefined'
      ? /Mobi|Android/i.test(navigator.userAgent)
      : false;
    
    return {
      tier,
      ram,
      cpuCores,
      gpu,
      network: connection?.effectiveType || '4g',
      isMobile,
      prefersReducedMotion,
      prefersDarkMode,
    };
  }
  
  /**
   * Apply optimized settings based on device profile
   */
  private applyOptimizations(): OptimizedConfig {
    const configs: Record<string, OptimizedConfig> = {
      low: {
        vectorPrecision: 'int8',
        maxResults: 3,
        chunkSize: 250,
        cacheSize: 10 * 1024 * 1024, // 10MB
        animations: false,
        preloadPages: 0,
        workerThreads: 0, // No worker on low-end
        lazyDecompress: true,
        virtualScroll: true,
      },
      medium: {
        vectorPrecision: 'float16',
        maxResults: 5,
        chunkSize: 500,
        cacheSize: 25 * 1024 * 1024, // 25MB
        animations: !this.profile.prefersReducedMotion,
        preloadPages: 2,
        workerThreads: 1,
        lazyDecompress: true,
        virtualScroll: true,
      },
      high: {
        vectorPrecision: 'float32',
        maxResults: 10,
        chunkSize: 1000,
        cacheSize: 50 * 1024 * 1024, // 50MB
        animations: !this.profile.prefersReducedMotion,
        preloadPages: 5,
        workerThreads: Math.min(this.profile.cpuCores - 1, 4),
        lazyDecompress: false,
        virtualScroll: false,
      },
    };
    
    const config = configs[this.profile.tier];
    
    // Override based on network
    if (this.profile.network === 'slow-2g' || this.profile.network === '2g') {
      config.lazyDecompress = true;
      config.preloadPages = 0;
      if (typeof localStorage !== 'undefined') {
        config.cacheSize = Math.min(config.cacheSize, 5 * 1024 * 1024);
      }
    }
    
    // Store config
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('depthindex_device_config', JSON.stringify(config));
    }
    
    console.log(`[DepthIndex] Device tier: ${this.profile.tier}`, {
      ram: `${this.profile.ram}GB`,
      cores: this.profile.cpuCores,
      gpu: this.profile.gpu,
      network: this.profile.network,
    });
    
    return config;
  }
  
  getProfile(): DeviceProfile {
    return this.profile;
  }
  
  getConfig(): OptimizedConfig {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('depthindex_device_config');
      if (stored) return JSON.parse(stored);
    }
    return this.applyOptimizations();
  }
}
