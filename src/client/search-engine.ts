import { SerializedIndex, SearchResult } from '../types/index.js';
import { processQuery } from './query-processor.js';
import { tokenizeAndStem } from '../utils/tokenizer.js';

export class DepthIndexEngine {
  private index: SerializedIndex | null = null;
  private vocabIndexMap: Record<string, number> = {};
  private avgDocLength = 0;
  private chunkLengths: number[] = [];

  constructor(index?: SerializedIndex) {
    if (index) {
      this.setIndex(index);
    }
  }

  public setIndex(index: SerializedIndex): void {
    // Guard against undefined, null, or malformed index data
    if (!index || !Array.isArray(index.vocabulary) || !Array.isArray(index.chunks)) {
      console.warn('[depthindex] setIndex received invalid index data — search will be unavailable until a valid index is loaded.');
      return;
    }
    this.index = index;
    
    // Map vocabulary strings to indices
    this.vocabIndexMap = Object.create(null);
    index.vocabulary.forEach((term, idx) => {
      this.vocabIndexMap[term] = idx;
    });

    // Compute document lengths and average length
    let totalLength = 0;
    this.chunkLengths = index.chunks.map(chunk => {
      // Simple word split for length
      const length = chunk.content.split(/\s+/).filter(w => w.length > 0).length || 1;
      totalLength += length;
      return length;
    });
    this.avgDocLength = totalLength / (index.chunks.length || 1);
  }

  public isLoaded(): boolean {
    return this.index !== null;
  }

  public search(query: string, topK: number = 5): SearchResult[] {
    try {
      if (!this.index) {
        console.warn('[depthindex] Search called before index is loaded.');
        return [];
      }

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return [];
      }

      const sanitizedQuery = query.trim().substring(0, 500);

      const intent = processQuery(sanitizedQuery);
      const queryTokens = intent.expandedTokens;

      if (queryTokens.length === 0) return [];

      const numChunks = this.index.chunks.length;
      const scores = new Array(numChunks).fill(0);
      const cosineScores = new Array(numChunks).fill(0);
      const bm25Scores = new Array(numChunks).fill(0);

      // 1. Calculate Query Vector for Cosine Similarity
      const queryTermCounts: Record<string, number> = Object.create(null);
      queryTokens.forEach(token => {
        queryTermCounts[token] = (queryTermCounts[token] || 0) + 1;
      });

      const queryTfidfMap: Record<number, number> = Object.create(null);
      let queryL2Sum = 0;

      Object.keys(queryTermCounts).forEach(token => {
        const termIdx = this.vocabIndexMap[token];
        if (termIdx !== undefined) {
          const tf = queryTermCounts[token] / queryTokens.length;
          const idfVal = this.index!.idf[termIdx];
          const tfidf = tf * idfVal;
          queryTfidfMap[termIdx] = tfidf;
          queryL2Sum += tfidf * tfidf;
        }
      });

      const queryL2Norm = Math.sqrt(queryL2Sum) || 1;
      const normalizedQueryVector: Record<number, number> = Object.create(null);
      Object.keys(queryTfidfMap).forEach(key => {
        const idx = Number(key);
        normalizedQueryVector[idx] = queryTfidfMap[idx] / queryL2Norm;
      });

      // 2. Identify candidate chunks
      const candidateChunks = new Set<number>();
      queryTokens.forEach(token => {
        const postingList = this.index!.invertedIndex[token] || [];
        postingList.forEach(item => {
          if (item && typeof item[0] === 'number') {
            candidateChunks.add(item[0]);
          }
        });
      });

      const k1 = 1.5;
      const b = 0.75;

      candidateChunks.forEach(i => {
        const chunk = this.index!.chunks[i] as any;
        if (!chunk) return;
        const docLen = this.chunkLengths[i] || 1;
        const docVector = chunk.vector || [];

        // A. Cosine score
        let dotProduct = 0;
        for (let j = 0; j < docVector.length; j += 2) {
          const termIdx = docVector[j];
          const val = docVector[j + 1];
          if (normalizedQueryVector[termIdx] !== undefined) {
            dotProduct += normalizedQueryVector[termIdx] * val;
          }
        }
        cosineScores[i] = dotProduct;

        // B. BM25 score
        let bm25Score = 0;
        queryTokens.forEach(token => {
          const termIdx = this.vocabIndexMap[token];
          if (termIdx !== undefined) {
            const idfVal = this.index!.idf[termIdx];
            const postingList = this.index!.invertedIndex[token] || [];
            const postMatch = postingList.find(item => item && item[0] === i);
            const tfInDoc = postMatch ? postMatch[1] : 0;

            if (tfInDoc > 0) {
              const numerator = tfInDoc * (k1 + 1);
              const denominator = tfInDoc + k1 * (1 - b + b * (docLen / this.avgDocLength));
              bm25Score += idfVal * (numerator / denominator);
            }
          }
        });
        bm25Scores[i] = bm25Score;

        // C. Hybrid Scoring
        const normalizedBm25 = Math.min(1.0, bm25Score / 10); 
        let score = 0.6 * cosineScores[i] + 0.4 * normalizedBm25;

        // D. Boosts
        const headingStems = tokenizeAndStem(chunk.heading || '');
        const titleStems = tokenizeAndStem(chunk.pageTitle || '');
        
        let headingMatchCount = 0;
        let titleMatchCount = 0;
        queryTokens.forEach(token => {
          if (headingStems.includes(token)) headingMatchCount++;
          if (titleStems.includes(token)) titleMatchCount++;
        });

        if (headingMatchCount > 0) {
          score *= (1 + 0.2 * headingMatchCount);
        }
        if (titleMatchCount > 0) {
          score *= (1 + 0.3 * titleMatchCount);
        }

        scores[i] = score;
      });

      // 3. Format results and return top K
      const results: SearchResult[] = [];
      for (let i = 0; i < numChunks; i++) {
        if (scores[i] > 0.01 && this.index.chunks[i]) {
          results.push({
            chunk: this.index.chunks[i],
            score: Math.min(1.0, scores[i]),
            cosineScore: cosineScores[i] || 0,
            bm25Score: bm25Scores[i] || 0
          });
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (error) {
      console.error('[DepthIndex] Search failed gracefully:', error);
      return [];
    }
  }
}
