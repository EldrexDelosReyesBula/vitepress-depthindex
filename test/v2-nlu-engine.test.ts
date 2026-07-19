import { describe, it, expect } from 'vitest';
import { NLUEngine } from '../src/client/nlu-engine.js';

describe('DepthIndex 1.1.6 NLU Engine', () => {

  it('should understand query type, intent and strategy correctly', () => {
    const nlu = new NLUEngine();

    // 1. Definition question
    const resDef = nlu.understand('What is VitePress DepthIndex?');
    expect(resDef.type).toBe('definition');
    expect(resDef.intent).toBe('learn');
    expect(resDef.complexity).toBe('simple');
    expect(resDef.strategy).toBe('local_preferred');
    expect(resDef.confidence).toBeGreaterThanOrEqual(0.65);

    // 2. How-to query — 'how do' triggers 'implement' intent (weight 0.9) over 'configure' (0.85)
    const resHowTo = nlu.understand('how do I configure custom settings for the search bar?');
    expect(resHowTo.type).toBe('how_to');
    expect(resHowTo.intent).toBe('implement');
    expect(resHowTo.complexity).toBe('moderate');
    expect(resHowTo.strategy).toBe('hybrid');

    // 3. Troubleshooting issue — 'why' triggers 'explanation' type
    const resTrouble = nlu.understand('why does it throw a MIME type error when starting dev server?');
    expect(resTrouble.type).toBe('explanation');
    expect(resTrouble.intent).toBe('fix');
    expect(resTrouble.complexity).toBe('moderate');
    // explanation type falls through determineStrategy → 'auto'
    expect(resTrouble.strategy).toBe('auto');
  });

  it('should extract entities accurately', () => {
    const nlu = new NLUEngine();

    const res = nlu.understand('how to build a Vue component using src/components/FloatingButton.vue');
    expect(res.entities.technology).toBe('vue');
    expect(res.entities.file).toBe('src/components/FloatingButton.vue');

    const res2 = nlu.understand('run npm install in local folder');
    expect(res2.entities.command).toBe('npm install');
  });

  it('should split multi-part questions', () => {
    const nlu = new NLUEngine();

    const res = nlu.understand('What is this plugin AND how to install it?');
    expect(res.subQuestions.length).toBe(2);
    expect(res.subQuestions[0]).toContain('What is this plugin');
    expect(res.subQuestions[1]).toContain('how to install it');

    const res2 = nlu.understand('1. first page 2. second page');
    expect(res2.subQuestions.length).toBe(2);
    expect(res2.subQuestions[0]).toContain('first page');
    expect(res2.subQuestions[1]).toContain('second page');
  });

});
