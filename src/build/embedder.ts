import { PageChunk, SerializedIndex } from '../types/index.js';
import { tokenizeAndStem } from '../utils/tokenizer.js';

export function buildSearchIndex(chunks: PageChunk[]): SerializedIndex {
  const N = chunks.length;
  
  // 1. Tokenize all chunks, counting term occurrences
  const chunkTokensList: string[][] = [];
  const vocabSet = new Set<string>();
  const docFreqs: Record<string, number> = Object.create(null);

  for (let i = 0; i < N; i++) {
    const chunk = chunks[i];
    
    // We weight page title and heading by repeating them
    const titleTokens = tokenizeAndStem(chunk.pageTitle);
    const headingTokens = tokenizeAndStem(chunk.heading);
    const contentTokens = tokenizeAndStem(chunk.content);

    // Extract code block tokens if present
    const codeTokens: string[] = [];
    if (chunk.codeBlocks) {
      chunk.codeBlocks.forEach(cb => {
        codeTokens.push(...tokenizeAndStem(cb.language), ...tokenizeAndStem(cb.code));
      });
    }

    // Extract mermaid diagram tokens if present
    const mermaidTokens: string[] = [];
    if (chunk.mermaidDiagrams) {
      chunk.mermaidDiagrams.forEach(m => {
        mermaidTokens.push(...tokenizeAndStem(m));
      });
    }

    // Combine tokens (repeat titles/headings for weight)
    const combinedTokens = [
      ...titleTokens,
      ...titleTokens,
      ...titleTokens,
      ...headingTokens,
      ...headingTokens,
      ...contentTokens,
      ...codeTokens,
      ...mermaidTokens
    ];

    chunkTokensList.push(combinedTokens);

    const uniqueInChunk = new Set(combinedTokens);
    for (const term of uniqueInChunk) {
      vocabSet.add(term);
      docFreqs[term] = (docFreqs[term] || 0) + 1;
    }
  }

  const vocabulary = Array.from(vocabSet).sort();
  const vocabIndexMap: Record<string, number> = Object.create(null);
  vocabulary.forEach((term, index) => {
    vocabIndexMap[term] = index;
  });

  // 2. Calculate IDF for each term
  const idf: number[] = [];
  vocabulary.forEach((term) => {
    const df = docFreqs[term] || 0;
    // BM25-based IDF scoring
    const idfVal = Math.max(0.0001, Math.log(1 + (N - df + 0.5) / (df + 0.5)));
    idf.push(idfVal);
  });

  // 3. Compute sparse TF-IDF vectors and build inverted index
  const invertedIndex: Record<string, [number, number][]> = Object.create(null);
  const serializedChunks: SerializedIndex['chunks'] = [];

  for (let i = 0; i < N; i++) {
    const tokens = chunkTokensList[i];
    const chunk = chunks[i];
    
    // Count frequencies of terms in this chunk
    const termCounts: Record<string, number> = Object.create(null);
    tokens.forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });

    // Compute TF-IDF values
    const tfidfList: { termIndex: number; value: number }[] = [];
    let l2Sum = 0;

    Object.keys(termCounts).forEach(term => {
      const termIndex = vocabIndexMap[term];
      const count = termCounts[term];
      const tf = count / tokens.length;
      const termIdf = idf[termIndex];
      const tfidf = tf * termIdf;
      
      tfidfList.push({ termIndex, value: tfidf });
      l2Sum += tfidf * tfidf;

      // Update inverted index for exact matching (BM25)
      if (!invertedIndex[term]) {
        invertedIndex[term] = [];
      }
      invertedIndex[term].push([i, count]);
    });

    // Normalize TF-IDF vector
    const l2Norm = Math.sqrt(l2Sum) || 1;
    const sparseVector: number[] = [];
    tfidfList.forEach(item => {
      const normVal = item.value / l2Norm;
      // Quantize value to 4 decimal places to save size
      const quantizedVal = Math.round(normVal * 10000) / 10000;
      
      // Store termIndex and quantizedVal sequentially: [index1, val1, index2, val2, ...]
      sparseVector.push(item.termIndex, quantizedVal);
    });

    serializedChunks.push({
      id: chunk.id,
      url: chunk.url,
      pageTitle: chunk.pageTitle,
      heading: chunk.heading,
      content: chunk.content,
      vector: sparseVector,
      codeBlocks: chunk.codeBlocks.length > 0 ? chunk.codeBlocks : undefined,
      mermaidDiagrams: chunk.mermaidDiagrams.length > 0 ? chunk.mermaidDiagrams : undefined
    });
  }

  return {
    vocabulary,
    idf,
    chunks: serializedChunks,
    invertedIndex
  };
}
