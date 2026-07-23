// src/gpu/memory-manager.ts

export class GPUMemoryManager {
  private device: any = null;
  private allocatedBuffers: any[] = [];
  private totalAllocated = 0;
  private maxMemory: number;

  constructor(maxMemoryMB: number = 512) {
    this.maxMemory = maxMemoryMB * 1024 * 1024;
  }

  setDevice(device: any): void {
    this.device = device;
  }

  createBuffer(size: number, usage: number): any | null {
    if (!this.device) return null;

    if (this.totalAllocated + size > this.maxMemory) {
      this.cleanup();
      if (this.totalAllocated + size > this.maxMemory) {
        console.warn('[DepthIndex GPU] Memory limit reached, skipping GPU allocation');
        return null;
      }
    }

    try {
      const buffer = this.device.createBuffer({ size, usage });
      this.allocatedBuffers.push(buffer);
      this.totalAllocated += size;
      return buffer;
    } catch (error) {
      console.warn('[DepthIndex GPU] Buffer allocation failed:', error);
      return null;
    }
  }

  cleanup(): void {
    for (const buffer of this.allocatedBuffers) {
      if (buffer && typeof buffer.destroy === 'function') {
        buffer.destroy();
      }
    }
    this.allocatedBuffers = [];
    this.totalAllocated = 0;
  }

  getMemoryUsage(): { allocated: number; max: number; percent: number } {
    return {
      allocated: this.totalAllocated,
      max: this.maxMemory,
      percent: this.maxMemory > 0 ? Math.round((this.totalAllocated / this.maxMemory) * 100) : 0,
    };
  }

  destroy(): void {
    this.cleanup();
    this.device = null;
  }
}
