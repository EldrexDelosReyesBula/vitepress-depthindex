import { describe, it, expect } from 'vitest';
import { ConversationMemory } from '../src/client/conversation-memory.js';

describe('ConversationMemory Architecture', () => {
  it('should initialize with custom options and empty registry', () => {
    const memory = new ConversationMemory({
      maxEntries: 5,
      sessionTimeout: 10000,
      customEntities: ['VitePress', 'DepthIndex']
    });

    expect(memory.export()).toEqual([]);
    expect(memory.isSessionActive()).toBe(false);
  });

  it('should correctly extract entities, topics, and intent from added messages', () => {
    const memory = new ConversationMemory({
      customEntities: ['DepthIndex', 'Algolia']
    });

    memory.add({
      role: 'user',
      content: 'How do I install "DepthIndex" and configure it on Vercel?',
      timestamp: Date.now()
    });

    const entries = memory.export();
    expect(entries.length).toBe(1);
    expect(entries[0].role).toBe('user');
    expect(entries[0].intent).toBe('how_to');
    expect(entries[0].entities).toContain('DepthIndex');
    expect(entries[0].entities).toContain('DepthIndex'); // custom entity registry match
    expect(entries[0].topics).toContain('install');
    expect(entries[0].topics).toContain('configure');
  });

  it('should detect troubleshooting intent on error keywords', () => {
    const memory = new ConversationMemory();
    memory.add({
      role: 'user',
      content: 'I got a build crash when running production bundle',
      timestamp: Date.now()
    });

    const entries = memory.export();
    expect(entries[0].intent).toBe('troubleshoot');
  });

  it('should resolve anaphoric references using recent message entities', () => {
    const memory = new ConversationMemory({
      customEntities: ['DepthIndex']
    });

    // Step 1: User mentions entity
    memory.add({
      role: 'user',
      content: 'Where is the code for DepthIndex?',
      timestamp: Date.now()
    });

    // Step 2: Assistant responds
    memory.add({
      role: 'assistant',
      content: 'It is hosted on GitHub under the Eldrex account.',
      timestamp: Date.now()
    });

    // Step 3: User uses anaphora "it"
    const query = 'How do I deploy it?';
    const resolved = memory.resolveAnaphora(query);
    expect(resolved).toBe('How do I deploy DepthIndex?');
  });

  it('should detect the current most frequent topic', () => {
    const memory = new ConversationMemory();

    memory.add({ role: 'user', content: 'How do I deploy this tool?', timestamp: Date.now() });
    memory.add({ role: 'user', content: 'What deploy options exist?', timestamp: Date.now() });
    memory.add({ role: 'user', content: 'How to build offline?', timestamp: Date.now() });

    expect(memory.getCurrentTopic()).toBe('deploy');
  });

  it('should respect session timeouts', () => {
    const memory = new ConversationMemory({
      sessionTimeout: 100 // 100ms
    });

    memory.add({ role: 'user', content: 'Test message', timestamp: Date.now() - 500 });
    expect(memory.isSessionActive()).toBe(false);
    expect(memory.getRecentEntries(5)).toEqual([]);
  });

  it('should trim old entries to maxEntries size', () => {
    const memory = new ConversationMemory({
      maxEntries: 2
    });

    memory.add({ role: 'user', content: 'Msg 1', timestamp: Date.now() });
    memory.add({ role: 'user', content: 'Msg 2', timestamp: Date.now() });
    memory.add({ role: 'user', content: 'Msg 3', timestamp: Date.now() });

    expect(memory.export().length).toBe(2);
    expect(memory.export()[0].content).toBe('Msg 2');
    expect(memory.export()[1].content).toBe('Msg 3');
  });
});
