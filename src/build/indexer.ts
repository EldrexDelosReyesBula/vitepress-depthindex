import { SerializedIndex } from '../types/index.js';
import { compressIndex } from '../utils/compression.js';

export function serializeAndCompressIndex(index: SerializedIndex): string {
  const jsonStr = JSON.stringify(index);
  return compressIndex(jsonStr);
}
