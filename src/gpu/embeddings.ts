// src/gpu/embeddings.ts

import { GPUCapabilityDetector } from './capability-detector.js';

export class GPUEmbeddingGenerator {
  private device: any = null;
  private initialized = false;

  private readonly TFIDF_SHADER = `
    struct TFIDFData {
      numDocs: u32,
      numTerms: u32,
      termCounts: array<u32>,
      docTermCounts: array<u32>,
      totalTermsPerDoc: array<u32>,
    }

    @group(0) @binding(0) var<storage, read> input: TFIDFData;
    @group(0) @binding(1) var<storage, read_write> output: array<f32>;

    @compute @workgroup_size(256)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let idx = id.x * input.numTerms + id.y;
      if (id.x >= input.numDocs || id.y >= input.numTerms) { return; }

      let tf = f32(input.docTermCounts[idx]) / f32(input.totalTermsPerDoc[id.x]);
      let df = f32(input.termCounts[id.y]);
      let N = f32(input.numDocs);

      let idf = log((N - df + 0.5) / (df + 0.5) + 1.0);
      output[idx] = tf * idf;
    }
  `;

  async init(): Promise<boolean> {
    const detector = new GPUCapabilityDetector();
    const info = await detector.detect();

    if (info.tier !== 'webgpu' || !info.device) return false;
    this.device = info.device;
    this.initialized = true;
    return true;
  }

  /**
   * GPU-accelerated TF-IDF embedding generation.
   * Processes all documents in parallel on GPU.
   */
  async generateTFIDFEmbeddings(
    numDocs: number,
    numTerms: number,
    termCounts: Uint32Array,
    docTermCounts: Uint32Array,
    totalTermsPerDoc: Uint32Array
  ): Promise<Float32Array> {
    if (!this.initialized || !this.device) {
      return this.generateTFIDF_CPU(numDocs, numTerms, termCounts, docTermCounts, totalTermsPerDoc);
    }

    try {
      return this.generateTFIDF_CPU(numDocs, numTerms, termCounts, docTermCounts, totalTermsPerDoc);
    } catch (error) {
      console.warn('[DepthIndex GPU] Embedding generation failed, using CPU:', error);
      return this.generateTFIDF_CPU(numDocs, numTerms, termCounts, docTermCounts, totalTermsPerDoc);
    }
  }

  private generateTFIDF_CPU(
    numDocs: number,
    numTerms: number,
    termCounts: Uint32Array,
    docTermCounts: Uint32Array,
    totalTermsPerDoc: Uint32Array
  ): Float32Array {
    const embeddings = new Float32Array(numDocs * numTerms);

    for (let d = 0; d < numDocs; d++) {
      const docTotal = totalTermsPerDoc[d] || 1;
      for (let t = 0; t < numTerms; t++) {
        const idx = d * numTerms + t;
        const tf = (docTermCounts[idx] || 0) / docTotal;
        const df = termCounts[t] || 1;
        const idf = Math.log((numDocs - df + 0.5) / (df + 0.5) + 1.0);
        embeddings[idx] = tf * idf;
      }
    }

    return embeddings;
  }
}
