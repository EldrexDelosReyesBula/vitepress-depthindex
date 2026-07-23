// src/gpu/capability-detector.ts

export interface GPUDeviceInfo {
  tier: 'webgpu' | 'webgl' | 'wasm' | 'cpu';
  device: any; // GPUDevice | WebGL2RenderingContext | null
  adapter: any; // GPUAdapter | null
  limits: {
    maxBufferSize: number;
    maxStorageBufferBindingSize: number;
    maxComputeWorkgroupSize: number;
    maxComputeWorkgroupsPerDimension: number;
  };
  features: string[];
  isIntegrated: boolean;
  vendor: string;
  renderer: string;
}

export class GPUCapabilityDetector {
  private deviceInfo: GPUDeviceInfo | null = null;

  /**
   * Detect best available GPU capability.
   * WebGPU → WebGL 2.0 → WASM SIMD → CPU
   */
  async detect(): Promise<GPUDeviceInfo> {
    if (this.deviceInfo) return this.deviceInfo;

    // Tier 1: WebGPU
    const webgpu = await this.tryWebGPU();
    if (webgpu) {
      this.deviceInfo = webgpu;
      return webgpu;
    }

    // Tier 2: WebGL 2.0
    const webgl = await this.tryWebGL();
    if (webgl) {
      this.deviceInfo = webgl;
      return webgl;
    }

    // Tier 3: WASM SIMD
    const wasm = await this.tryWASM();
    if (wasm) {
      this.deviceInfo = wasm;
      return wasm;
    }

    // Tier 4: CPU
    this.deviceInfo = this.cpuFallback();
    return this.deviceInfo;
  }

  private async tryWebGPU(): Promise<GPUDeviceInfo | null> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null;

    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) return null;

      let device: any = null;
      try {
        device = await adapter.requestDevice({
          requiredFeatures: ['shader-f16', 'timestamp-query'],
          requiredLimits: {
            maxStorageBufferBindingSize: 1024 * 1024 * 1024, // 1GB
            maxComputeWorkgroupSize: 256,
          },
        });
      } catch {
        // Fallback requestDevice without strict requirements if features missing
        device = await adapter.requestDevice();
      }

      const limits = adapter.limits || {};
      const features = Array.from(adapter.features || []);

      return {
        tier: 'webgpu',
        device,
        adapter,
        limits: {
          maxBufferSize: limits.maxBufferSize || 256 * 1024 * 1024,
          maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize || 128 * 1024 * 1024,
          maxComputeWorkgroupSize: limits.maxComputeWorkgroupSize || 256,
          maxComputeWorkgroupsPerDimension: limits.maxComputeWorkgroupsPerDimension || 65535,
        },
        features: features as string[],
        isIntegrated: adapter.isFallbackAdapter || false,
        vendor: 'GPU',
        renderer: 'WebGPU',
      };
    } catch (error) {
      console.warn('[DepthIndex GPU] WebGPU not available:', error);
      return null;
    }
  }

  private async tryWebGL(): Promise<GPUDeviceInfo | null> {
    if (typeof document === 'undefined') return null;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');

      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : 'Unknown';
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'Unknown';

      return {
        tier: 'webgl',
        device: gl,
        adapter: null,
        limits: {
          maxBufferSize: 256 * 1024 * 1024, // 256MB
          maxStorageBufferBindingSize: 128 * 1024 * 1024,
          maxComputeWorkgroupSize: 128,
          maxComputeWorkgroupsPerDimension: 65535,
        },
        features: ['WEBGL2', ...(gl.getSupportedExtensions() || [])],
        isIntegrated: String(renderer).toLowerCase().includes('intel') ||
                      String(renderer).toLowerCase().includes('mali') ||
                      String(renderer).toLowerCase().includes('adreno'),
        vendor: String(vendor),
        renderer: String(renderer),
      };
    } catch {
      return null;
    }
  }

  private async tryWASM(): Promise<GPUDeviceInfo | null> {
    if (typeof WebAssembly === 'undefined') return null;

    try {
      await WebAssembly.instantiate(
        new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]), // Minimal WASM
        {}
      );
      return {
        tier: 'wasm',
        device: null,
        adapter: null,
        limits: {
          maxBufferSize: 512 * 1024 * 1024,
          maxStorageBufferBindingSize: 512 * 1024 * 1024,
          maxComputeWorkgroupSize: 4,
          maxComputeWorkgroupsPerDimension: 1,
        },
        features: ['WASM', 'SIMD'],
        isIntegrated: true,
        vendor: 'CPU',
        renderer: 'WebAssembly SIMD',
      };
    } catch {
      return null;
    }
  }

  private cpuFallback(): GPUDeviceInfo {
    return {
      tier: 'cpu',
      device: null,
      adapter: null,
      limits: {
        maxBufferSize: 128 * 1024 * 1024,
        maxStorageBufferBindingSize: 64 * 1024 * 1024,
        maxComputeWorkgroupSize: 1,
        maxComputeWorkgroupsPerDimension: 1,
      },
      features: [],
      isIntegrated: true,
      vendor: 'CPU',
      renderer: 'JavaScript Engine',
    };
  }

  getTier(): string {
    return this.deviceInfo?.tier || 'cpu';
  }

  isGPUAvailable(): boolean {
    return this.deviceInfo?.tier === 'webgpu' || this.deviceInfo?.tier === 'webgl';
  }
}
