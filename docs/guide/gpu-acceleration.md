# GPU Acceleration

## Overview
VitePress DepthIndex provides WebGPU-accelerated vector search and TF-IDF embedding generation to deliver lightning-fast on-device document query speeds.

## How It Works
DepthIndex inspects the client environment on initialization to determine hardware capability tiers. If WebGPU is supported, matrix operations, cosine similarity scoring, and batch token processing run directly on GPU compute shaders.

## Requirements

### Browser Support
- **Chrome / Edge**: 113+
- **Firefox**: 115+ (with WebGPU flag enabled)
- **Safari**: 18+ (macOS Sonoma / iOS 17+)

### Hardware Requirements
- Dedicated GPU or modern integrated graphics card (Apple Silicon M-series, Intel Iris Xe, AMD Radeon, NVIDIA GTX/RTX).
- Minimum 256MB VRAM recommended.

## Capability Tiers

### WebGPU (Best)
Highest performance tier using WGSL compute shaders. Achieves 10-50x speedups for similarity searches and batch operations.

### WebGL 2.0 (Good)
Fallback GPU tier for browser engines that lack native WebGPU compute pipelines.

### WASM SIMD (Better)
WebAssembly with Single Instruction Multiple Data instructions for fast CPU vector operations.

### CPU (Always Available)
Standard JavaScript engine execution fallback. Guarantees 100% compatibility across all device environments.

## Accelerated Operations

### Vector Similarity Search
Parallel compute shaders evaluate cosine similarity across thousands of document embeddings in under 5ms.

### Embedding Generation
Fast parallel TF-IDF calculation across document vocabularies on device setup and search time.

### Batch Processing
Concurrent tokenization and scoring across document chunks.

## Configuration

### Enabling/Disabling
Pass `gpu.enabled` in your DepthIndex configuration:

```typescript
DepthIndex({
  gpu: {
    enabled: true, // Set false to disable GPU acceleration
  },
})
```

### Memory Limits
Control maximum GPU RAM usage in megabytes (MB):

```typescript
DepthIndex({
  gpu: {
    maxMemoryMB: 256, // Default: 256MB
  },
})
```

### Fallback Behavior
Specify how DepthIndex handles unsupported environments:

```typescript
DepthIndex({
  gpu: {
    fallback: 'silent', // 'silent' | 'warn' | 'error'
  },
})
```

## Performance Benchmarks

| Operation | CPU (JS) | WebGPU | Speedup |
|-----------|----------|--------|---------|
| Cosine Similarity (1000 docs) | 45ms | 3ms | **15x** |
| Cosine Similarity (10000 docs) | 450ms | 12ms | **37x** |
| TF-IDF Embeddings (1000 docs) | 120ms | 8ms | **15x** |
| BM25 Scoring (5000 docs) | 200ms | 10ms | **20x** |
| Batch Token Processing | 80ms | 2ms | **40x** |
| Index Decompression | 300ms | 50ms | **6x** |

## Mobile Considerations
On mobile devices with constrained GPU resources, configure lower memory limits:

```typescript
DepthIndex({
  gpu: {
    enabled: true,
    maxMemoryMB: 64,
    fallback: 'silent',
  },
})
```

## Debugging
Inspect browser console logs to verify GPU initialization:
```
[DepthIndex GPU] WebGPU acceleration enabled
```
Or check detector tier programmatically:
```typescript
import { GPUCapabilityDetector } from 'vitepress-plugin-depthindex/gpu';

const detector = new GPUCapabilityDetector();
const info = await detector.detect();
console.log('Tier:', info.tier, 'Renderer:', info.renderer);
```

## Limitations
- WebGPU compute shaders require HTTPS context (or localhost).
- If VRAM is exhausted, DepthIndex gracefully falls back to WASM/CPU without interrupting query execution.
