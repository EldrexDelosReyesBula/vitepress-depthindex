import LZString from 'lz-string';

export function compressIndex(indexJson: string): string {
  return LZString.compressToBase64(indexJson);
}

export function decompressIndex(compressed: string): string {
  return LZString.decompressFromBase64(compressed) || '{}';
}
