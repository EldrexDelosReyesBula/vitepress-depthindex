import { describe, it, expect } from 'vitest';
import { CitationRenderer, Citation } from '../src/client/citation-renderer.js';

describe('CitationRenderer Module', () => {
  const sampleCitations: Citation[] = [
    { index: 1, url: '/guide/installation', title: 'Installation Guide', section: 'Quick Start' },
    { index: 2, url: '/guide/configuration', title: 'Configuration Guide' },
  ];

  it('should render superscript style citations', () => {
    const renderer = new CitationRenderer({ citations: { style: 'superscript' } });
    const text = 'Install the package[^1] and configure settings[^2].';
    const rendered = renderer.renderCitations(text, sampleCitations);

    expect(rendered).toContain('<sup><a href="/guide/installation" class="di-cite di-cite-sup" title="Installation Guide">1</a></sup>');
    expect(rendered).toContain('<sup><a href="/guide/configuration" class="di-cite di-cite-sup" title="Configuration Guide">2</a></sup>');
  });

  it('should render inline style citations', () => {
    const renderer = new CitationRenderer({ citations: { style: 'inline' } });
    const text = 'Install the package[^1].';
    const rendered = renderer.renderCitations(text, sampleCitations);

    expect(rendered).toContain('<a href="/guide/installation" class="di-cite di-cite-inline" title="Installation Guide">[1]</a>');
  });

  it('should render underline style citations', () => {
    const renderer = new CitationRenderer({ citations: { style: 'underline' } });
    const text = 'Check [^1].';
    const rendered = renderer.renderCitations(text, sampleCitations);

    expect(rendered).toContain('class="di-cite di-cite-underline"');
    expect(rendered).toContain('Installation Guide');
  });

  it('should render pill style references when enabled', () => {
    const renderer = new CitationRenderer({
      references: { enabled: true, style: 'pills', title: 'Sources' }
    });
    const html = renderer.renderReferences(sampleCitations);

    expect(html).toContain('di-ref-pills');
    expect(html).toContain('Sources');
    expect(html).toContain('Installation Guide');
  });
});
