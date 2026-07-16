import { ICONS } from './icons.js';

export interface RenderBlock {
  type: 'math' | 'mermaid' | 'code';
  placeholder: string;
  original: string;
  language?: string;
  displayMode?: boolean;
}

export class ContentRenderer {
  private katexLoaded = false;
  private mermaidLoaded = false;
  private katexObj: any = null;
  private mermaidObj: any = null;
  private placeholderCounter = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      if ((window as any).katex) {
        this.katexObj = (window as any).katex;
        this.katexLoaded = true;
      }
      if ((window as any).mermaid) {
        this.mermaidObj = (window as any).mermaid;
        this.mermaidLoaded = true;
        this.initMermaid();
      }
    }
  }

  private initMermaid(): void {
    if (this.mermaidObj) {
      try {
        const isDark = typeof document !== 'undefined' &&
          document.documentElement.classList.contains('dark');
        this.mermaidObj.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          suppressErrorRendering: true,
        });
      } catch (err) {
        console.warn('[DepthIndex] Failed to initialize mermaid:', err);
      }
    }
  }

  async ensureKatex(): Promise<boolean> {
    if (this.katexLoaded) return true;
    if (typeof window === 'undefined') return false;
    try {
      try {
        const libName = 'katex';
        // @ts-ignore
        const mod = await import(/* @vite-ignore */ libName);
        this.katexObj = mod.default || mod;
        this.katexLoaded = true;
        return true;
      } catch { /* fall through */ }
      if (!document.getElementById('katex-css')) {
        const link = document.createElement('link');
        link.id = 'katex-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
      }
      this.katexObj = await this.loadScript(
        'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
        'katex'
      );
      this.katexLoaded = !!this.katexObj;
      return this.katexLoaded;
    } catch (err) {
      console.warn('[DepthIndex] Failed to load KaTeX dynamically:', err);
      return false;
    }
  }

  async ensureMermaid(): Promise<boolean> {
    if (this.mermaidLoaded) return true;
    if (typeof window === 'undefined') return false;
    try {
      try {
        const libName = 'mermaid';
        // @ts-ignore
        const mod = await import(/* @vite-ignore */ libName);
        this.mermaidObj = mod.default || mod;
        this.mermaidLoaded = true;
        this.initMermaid();
        return true;
      } catch { /* fall through */ }
      this.mermaidObj = await this.loadScript(
        'https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js',
        'mermaid'
      );
      this.mermaidLoaded = !!this.mermaidObj;
      if (this.mermaidLoaded) this.initMermaid();
      return this.mermaidLoaded;
    } catch (err) {
      console.warn('[DepthIndex] Failed to load Mermaid dynamically:', err);
      return false;
    }
  }

  private loadScript(url: string, globalName: string): Promise<any> {
    return new Promise((resolve) => {
      if ((window as any)[globalName]) {
        resolve((window as any)[globalName]);
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve((window as any)[globalName]);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  }

  /**
   * Main async render method — fully handles markdown, code blocks,
   * mermaid diagrams, math, images, videos, YouTube embeds, tables,
   * and bare-URL auto-linking.
   */
  async renderMarkdown(text: string): Promise<string> {
    if (!text) return '';

    const blocks: RenderBlock[] = [];
    let processed = text;

    // Phase 0: Extract existing HTML blocks/inline elements to protect them
    // This covers citation <sup><a...> tags, reference <div> sections, etc.
    const htmlProtected: Map<string, string> = new Map();
    let htmlIdx = 0;
    processed = processed.replace(
      /<(sup|div|span|ol|ul|li|h[1-6]|blockquote|hr|pre|code|strong|em|del|a|img|br|p|table|thead|tbody|tr|th|td)(\s[^>]*)?>[\s\S]*?<\/\1>|<(br|hr|img)(\s[^>]*)?\/?\s*>/gi,
      (match) => {
        const key = `__HTML_${htmlIdx++}__`;
        htmlProtected.set(key, match);
        return key;
      }
    );

    // Phase 1: Extract block-level special components (protect them from inline rendering)
    processed = this.extractMermaidBlocks(processed, blocks);
    processed = this.extractMathBlocks(processed, blocks);
    processed = this.extractCodeBlocks(processed, blocks);

    // Phase 2: Render the remaining text as Markdown
    let rendered = this.renderMarkdownToHtml(processed);

    // Phase 3: Media Rendering — after markdown so bare URLs in paragraphs are caught
    rendered = this.renderYouTubeEmbeds(rendered);
    rendered = this.renderImages(rendered);
    rendered = this.renderVideos(rendered);
    rendered = this.renderAutoLinks(rendered);

    // Phase 4: Restore async blocks (code, mermaid, math)
    rendered = await this.replaceAsyncBlocks(rendered, blocks);

    // Phase 5: Restore protected HTML
    for (const [key, val] of htmlProtected) {
      rendered = rendered.split(key).join(val);
    }

    return rendered;
  }

  private extractMermaidBlocks(text: string, blocks: RenderBlock[]): string {
    return text.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_, diagramCode) => {
      const placeholder = `__DEPTHINDEX_MERMAID_${this.placeholderCounter++}__`;
      blocks.push({ type: 'mermaid', placeholder, original: diagramCode.trim() });
      return `\n${placeholder}\n`;
    });
  }

  private extractMathBlocks(text: string, blocks: RenderBlock[]): string {
    return text.replace(/\$\$([\s\S]*?)\$\$/g, (_, expression) => {
      const placeholder = `__DEPTHINDEX_MATH_DISPLAY_${this.placeholderCounter++}__`;
      blocks.push({ type: 'math', placeholder, original: expression.trim(), displayMode: true });
      return `\n${placeholder}\n`;
    });
  }

  private extractCodeBlocks(text: string, blocks: RenderBlock[]): string {
    return text.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (match, language, code) => {
      if (language === 'mermaid') return match;
      const placeholder = `__DEPTHINDEX_CODE_${this.placeholderCounter++}__`;
      blocks.push({ type: 'code', placeholder, original: code, language: language || 'text' });
      return `\n${placeholder}\n`;
    });
  }

  /**
   * Full Markdown-to-HTML renderer.
   * Processes the text block-by-block (paragraphs, headings, lists, tables,
   * blockquotes, hr) then applies inline formatting within each block.
   */
  private renderMarkdownToHtml(text: string): string {
    const lines = text.split('\n');
    const outputBlocks: string[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Pass through placeholder lines untouched
      if (line.trim().startsWith('__DEPTHINDEX_') || line.trim().startsWith('__HTML_')) {
        outputBlocks.push(line.trim());
        i++;
        continue;
      }

      // Horizontal rule
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        outputBlocks.push('<hr class="md-hr">');
        i++;
        continue;
      }

      // ATX Headings (h1–h4)
      const h4m = line.match(/^#### (.+)/);
      const h3m = line.match(/^### (.+)/);
      const h2m = line.match(/^## (.+)/);
      const h1m = line.match(/^# (.+)/);
      if (h4m) { outputBlocks.push(`<h4 class="md-h4">${this.renderInline(h4m[1])}</h4>`); i++; continue; }
      if (h3m) { outputBlocks.push(`<h3 class="md-h3">${this.renderInline(h3m[1])}</h3>`); i++; continue; }
      if (h2m) { outputBlocks.push(`<h2 class="md-h2">${this.renderInline(h2m[1])}</h2>`); i++; continue; }
      if (h1m) { outputBlocks.push(`<h2 class="md-h1">${this.renderInline(h1m[1])}</h2>`); i++; continue; }

      // GFM Tables: detect pipe-row followed by separator
      if (/^\|.+\|/.test(line) && i + 1 < lines.length && /^\|[\s\-:|]+\|/.test(lines[i + 1])) {
        const tableLines: string[] = [];
        while (i < lines.length && /^\|.+\|/.test(lines[i])) {
          tableLines.push(lines[i]);
          i++;
        }
        outputBlocks.push(this.renderTable(tableLines));
        continue;
      }

      // Unordered list
      if (/^[ \t]*[-*+] /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[ \t]*[-*+] /.test(lines[i])) {
          items.push(`<li>${this.renderInline(lines[i].replace(/^[ \t]*[-*+] /, '').trim())}</li>`);
          i++;
        }
        outputBlocks.push(`<ul class="md-ul">${items.join('')}</ul>`);
        continue;
      }

      // Ordered list
      if (/^[ \t]*\d+\. /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[ \t]*\d+\. /.test(lines[i])) {
          items.push(`<li>${this.renderInline(lines[i].replace(/^[ \t]*\d+\. /, '').trim())}</li>`);
          i++;
        }
        outputBlocks.push(`<ol class="md-ol">${items.join('')}</ol>`);
        continue;
      }

      // Blockquote
      if (/^> /.test(line)) {
        const parts: string[] = [];
        while (i < lines.length && /^> /.test(lines[i])) {
          parts.push(this.renderInline(lines[i].replace(/^> /, '').trim()));
          i++;
        }
        outputBlocks.push(`<blockquote class="md-blockquote"><p>${parts.join('<br>')}</p></blockquote>`);
        continue;
      }

      // Empty line — paragraph break
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Regular paragraph — each line = its own paragraph when followed by blank
      // or collect consecutive non-empty non-special lines as one paragraph
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('__DEPTHINDEX_') &&
        !lines[i].trim().startsWith('__HTML_') &&
        !/^#{1,6} /.test(lines[i]) &&
        !/^[ \t]*[-*+] /.test(lines[i]) &&
        !/^[ \t]*\d+\. /.test(lines[i]) &&
        !/^> /.test(lines[i]) &&
        !/^\|.+\|/.test(lines[i]) &&
        !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }
      if (paragraphLines.length > 0) {
        // Each line becomes its own sentence with a space between them in a paragraph.
        // Use <br> only when a single consecutive blank line appears within paragraph group.
        const content = paragraphLines
          .map(l => this.renderInline(l))
          .join(' ');
        outputBlocks.push(`<p class="md-p">${content}</p>`);
      }
    }

    return outputBlocks.join('\n');
  }

  /**
   * Render a GFM-style markdown table from collected row lines.
   */
  private renderTable(tableLines: string[]): string {
    if (tableLines.length < 2) return tableLines.join('\n');

    const parseRow = (row: string) =>
      row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());

    const headers = parseRow(tableLines[0]);
    // tableLines[1] is the separator row — skip it
    const rows = tableLines.slice(2).map(parseRow);

    const headerHtml = headers
      .map(h => `<th class="md-th">${this.renderInline(h)}</th>`)
      .join('');

    const bodyHtml = rows
      .map(cells => {
        const tds = cells
          .map(c => `<td class="md-td">${this.renderInline(c)}</td>`)
          .join('');
        return `<tr class="md-tr">${tds}</tr>`;
      })
      .join('');

    return `<div class="md-table-wrapper"><table class="md-table">
      <thead class="md-thead"><tr class="md-tr">${headerHtml}</tr></thead>
      <tbody class="md-tbody">${bodyHtml}</tbody>
    </table></div>`;
  }

  /**
   * Renders inline Markdown: bold, italic, strikethrough, inline code, links, math.
   * Existing HTML tags (like citation <sup> elements) are protected before processing.
   */
  private renderInline(text: string): string {
    let s = text;

    // 0. Protect existing HTML tags from being mangled by markdown rules
    const htmlMap: Record<string, string> = {};
    s = s.replace(
      /<(sup|sub|strong|em|del|code|a|span|div|br)(\s[^>]*)?>[\s\S]*?<\/\1>|<__HTML_\d+__>|__HTML_\d+__|<(br|hr|img)(\s[^>]*)?\/?\s*>/gi,
      (match) => {
        if (match.startsWith('__HTML_')) return match;
        const key = `__INLINEHTML_${Object.keys(htmlMap).length}__`;
        htmlMap[key] = match;
        return key;
      }
    );

    // 1. Protect inline code first (avoid applying other formatting inside)
    const inlineCodeMap: Record<string, string> = {};
    s = s.replace(/`([^`]+)`/g, (_, code) => {
      const key = `__ICODE_${Object.keys(inlineCodeMap).length}__`;
      inlineCodeMap[key] = `<code class="md-inline-code">${this.escapeHtml(code)}</code>`;
      return key;
    });

    // 2. Inline math $...$
    s = s.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
      return this.renderMathSync(expr.trim());
    });

    // 3. Bold+italic ***text***
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text* (single asterisk, not inside words)
    s = s.replace(/(^|[\s([{])_([^_]+)_([\s)\]},.]|$)/g, '$1<em>$2</em>$3');
    s = s.replace(/(^|[\s([{])\*([^*\n]+)\*([\s)\]},.]|$)/g, '$1<em>$2</em>$3');
    // Strikethrough ~~text~~
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 4. Image before link (priority — avoid treating alt text link as a regular link)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      const trimmedSrc = src.trim();
      return `<img src="${trimmedSrc}" alt="${this.escapeHtml(alt)}" class="md-inline-img" loading="lazy" onerror="this.style.display='none'" />`;
    });

    // 5. Links [text](url) — internal doc links get router-friendly class
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const trimmedUrl = url.trim();
      const isInternal = trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//');
      if (isInternal) {
        return `<a href="${trimmedUrl}" class="md-link md-link-internal">${label}</a>`;
      }
      return `<a href="${trimmedUrl}" class="md-link" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    // Restore inline code
    for (const [key, val] of Object.entries(inlineCodeMap)) {
      s = s.replace(key, val);
    }

    // Restore protected HTML
    for (const [key, val] of Object.entries(htmlMap)) {
      s = s.split(key).join(val);
    }

    return s;
  }

  private async replaceAsyncBlocks(html: string, blocks: RenderBlock[]): Promise<string> {
    let result = html;
    const renderedBlocks = await Promise.all(
      blocks.map(async (block) => {
        let rendered: string;
        switch (block.type) {
          case 'mermaid':
            rendered = await this.renderMermaid(block.original);
            break;
          case 'math':
            rendered = await this.renderMath(block.original, block.displayMode || false);
            break;
          case 'code':
            rendered = this.renderCodeBlock(block.original, block.language);
            break;
          default:
            rendered = block.original;
        }
        return { placeholder: block.placeholder, rendered };
      })
    );
    for (const { placeholder, rendered } of renderedBlocks) {
      result = result.replace(placeholder, rendered);
    }
    return result;
  }

  async renderMermaid(diagramCode: string): Promise<string> {
    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window === 'undefined' || !this.mermaidLoaded || !this.mermaidObj) {
      this.ensureMermaid();
      return `<div class="mermaid-container loading" id="container-${id}">
        <div class="mermaid-diagram" id="${id}" data-diagram="${this.escapeAttr(diagramCode)}">
          <pre class="language-mermaid"><code>${this.escapeHtml(diagramCode)}</code></pre>
        </div>
        <p class="mermaid-loading-hint">⏳ Loading diagram renderer…</p>
      </div>`;
    }
    try {
      const { svg } = await Promise.race([
        this.mermaidObj.render(id, diagramCode.trim()),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ]);
      return `<div class="mermaid-container">
        <div class="mermaid-diagram rendered" id="${id}" data-diagram="${this.escapeAttr(diagramCode)}">${svg}</div>
        <details class="mermaid-source">
          <summary>View diagram source</summary>
          <pre><code class="language-mermaid">${this.escapeHtml(diagramCode)}</code></pre>
        </details>
      </div>`;
    } catch (error: any) {
      console.warn('[DepthIndex] Mermaid render failed:', error.message || error);
      return `<div class="mermaid-fallback">
        <div class="mermaid-error-banner">⚠️ Unable to render diagram</div>
        <details class="mermaid-source" open>
          <summary>View diagram code</summary>
          <pre><code class="language-mermaid">${this.escapeHtml(diagramCode)}</code></pre>
        </details>
      </div>`;
    }
  }

  async renderMath(expression: string, displayMode: boolean): Promise<string> {
    await this.ensureKatex();
    if (this.katexLoaded && this.katexObj) {
      try {
        const html = this.katexObj.renderToString(expression.trim(), {
          displayMode, throwOnError: false, trust: false, strict: 'warn',
        });
        return displayMode
          ? `<div class="math-display">${html}</div>`
          : `<span class="math-inline">${html}</span>`;
      } catch (err: any) {
        return `<code class="math-error" title="${this.escapeAttr(err.message)}">${this.escapeHtml(expression)}</code>`;
      }
    }
    return displayMode
      ? `<div class="math-display math-loading" data-math="${this.escapeAttr(expression)}">$$\n${this.escapeHtml(expression)}\n$$</div>`
      : `<span class="math-inline math-loading" data-math="${this.escapeAttr(expression)}">${this.escapeHtml(expression)}</span>`;
  }

  private renderMathSync(expression: string): string {
    if (this.katexLoaded && this.katexObj) {
      try {
        return this.katexObj.renderToString(expression.trim(), {
          displayMode: false, throwOnError: false, trust: false, strict: 'warn',
        });
      } catch (err) {
        return `<code class="math-error">${this.escapeHtml(expression)}</code>`;
      }
    }
    return `<span class="math-inline math-loading" data-math="${this.escapeAttr(expression)}">${this.escapeHtml(expression)}</span>`;
  }

  renderCodeBlock(code: string, language?: string): string {
    const lang = language || 'text';
    const escapedCode = this.escapeHtml(code.trim());
    const highlighted = this.highlightCode(code.trim(), lang);

    const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-language">
          <span class="icon">${ICONS.code}</span> ${lang}
        </span>
        <button class="copy-button" onclick="(function(btn){var raw=btn.closest('.code-block-wrapper').querySelector('.code-raw').textContent;navigator.clipboard.writeText(raw).then(function(){btn.classList.add('copied');setTimeout(function(){btn.classList.remove('copied');},2000)});})(this)">
          <span class="copy-btn-content" style="display:flex;align-items:center;gap:4px;">${copyIcon} Copy</span>
          <span class="copied-btn-content" style="display:none;align-items:center;gap:4px;">${checkIcon} Copied</span>
        </button>
      </div>
      <pre class="code-block language-${lang}"><code>${highlighted}</code></pre>
      <div class="code-raw" style="display:none;">${escapedCode}</div>
    </div>`;
  }

  private highlightCode(code: string, language: string): string {
    const escaped = this.escapeHtml(code);
    const lang = language.toLowerCase();

    if (['typescript', 'javascript', 'ts', 'js', 'tsx', 'jsx'].includes(lang)) {
      return escaped
        .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|interface|type|enum|import|export|from|as|default|async|await|try|catch|finally|new|throw|typeof|instanceof|void|never|any|string|number|boolean|null|undefined|extends|implements|declare|abstract|private|public|protected|static|readonly)\b/g,
          '<span class="tok-kw">$1</span>')
        .replace(/\b(true|false)\b/g, '<span class="tok-bool">$1</span>')
        .replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
        .replace(/'([^'\\]|\\.)*'/g, '<span class="tok-str">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="tok-str">$&</span>')
        .replace(/`([^`\\]|\\.)*`/g, '<span class="tok-str">$&</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    }
    if (['python', 'py'].includes(lang)) {
      return escaped
        .replace(/\b(def|class|import|from|as|return|if|elif|else|for|while|with|try|except|finally|raise|pass|break|continue|lambda|yield|async|await|True|False|None|and|or|not|in|is)\b/g,
          '<span class="tok-kw">$1</span>')
        .replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>')
        .replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '<span class="tok-str">$&</span>')
        .replace(/'([^'\\]|\\.)*'/g, '<span class="tok-str">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="tok-str">$&</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    }
    if (['bash', 'sh', 'shell', 'zsh'].includes(lang)) {
      return escaped
        .replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>')
        .replace(/\b(npm|npx|pnpm|yarn|git|cd|ls|mkdir|rm|cp|mv|echo|export|source|curl|wget|chmod|sudo|apt|brew)\b/g,
          '<span class="tok-kw">$1</span>')
        .replace(/'([^'\\]|\\.)*'/g, '<span class="tok-str">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="tok-str">$&</span>');
    }
    if (['json'].includes(lang)) {
      return escaped
        .replace(/"([^"]+)"(\s*:)/g, '<span class="tok-key">"$1"</span>$2')
        .replace(/:\s*"([^"]+)"/g, ': <span class="tok-str">"$1"</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="tok-bool">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    }
    if (['html', 'xml', 'vue'].includes(lang)) {
      return escaped
        .replace(/&lt;(\/?[\w-]+)(\s[^&]*)?\s*(\/?)&gt;/g,
          '&lt;<span class="tok-kw">$1</span>$2$3&gt;')
        .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="tok-comment">$&</span>');
    }
    if (['css', 'scss'].includes(lang)) {
      return escaped
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
        .replace(/([.#][\w-]+)\s*\{/g, '<span class="tok-kw">$1</span> {')
        .replace(/([\w-]+)\s*:/g, '<span class="tok-key">$1</span>:')
        .replace(/'([^'\\]|\\.)*'/g, '<span class="tok-str">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="tok-str">$&</span>');
    }
    if (['yaml', 'yml'].includes(lang)) {
      return escaped
        .replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>')
        .replace(/^([ \t]*)([\w-]+):/mg, '$1<span class="tok-key">$2</span>:')
        .replace(/:\s*"([^"]+)"/g, ': <span class="tok-str">"$1"</span>')
        .replace(/:\s*'([^']+)'/g, ': <span class="tok-str">\'$1\'</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="tok-bool">$1</span>');
    }
    return escaped;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private escapeAttr(text: string): string {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /**
   * Auto-convert bare URLs to clickable links.
   * Runs AFTER markdown link rendering so [text](url) links aren't double-processed.
   * Skips URLs already inside href="..." or src="..." attributes.
   */
  private renderAutoLinks(text: string): string {
    // Match bare URLs not already in an HTML attribute context
    return text.replace(
      /(?<![="'`])(https?:\/\/[^\s<>"')\]]+)(?![^<]*>)/g,
      (url) => {
        // Trim trailing punctuation that isn't part of the URL
        const clean = url.replace(/[.,;:!?)\]]+$/, '');
        const suffix = url.slice(clean.length);
        const isInternal = false; // external links only
        return `<a href="${clean}" class="md-link md-autolink" target="_blank" rel="noopener noreferrer">${clean}</a>${suffix}`;
      }
    );
  }

  /**
   * Render images with lightbox support — handles markdown ![]() and bare image URLs.
   */
  private renderImages(text: string): string {
    // Standard markdown images — already handled in renderInline as md-inline-img;
    // here we handle standalone paragraph-level image references (block-level figures)
    text = text.replace(
      /<p class="md-p"><img src="([^"]+)" alt="([^"]*)" class="md-inline-img"[^>]*><\/p>/g,
      (_, src, alt) => {
        return `<figure class="content-image">
          <img src="${src}" alt="${alt}" loading="lazy"
               onclick="this.closest('.content-image').classList.toggle('expanded')"
               onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex')"
          />
          <div class="image-error" style="display:none">
            <span>🖼️ Image unavailable</span>
          </div>
          ${alt ? `<figcaption>${this.escapeHtml(alt)}</figcaption>` : ''}
        </figure>`;
      }
    );

    // Bare image URLs in text (not already wrapped)
    text = text.replace(
      /(?<!["'(])(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|svg|webp)(?:\?[^\s]*)?)(?!["')])/gi,
      (match) => {
        return `<figure class="content-image">
          <img src="${match}" alt="Image" loading="lazy"
               onclick="this.closest('.content-image').classList.toggle('expanded')"
               onerror="this.style.display='none'"
          />
        </figure>`;
      }
    );

    return text;
  }

  /**
   * Render video embeds — handles .mp4/.webm/.ogg bare URLs and markdown links to videos.
   */
  private renderVideos(text: string): string {
    text = text.replace(
      /(?<!["'(])(https?:\/\/[^\s]+\.(?:mp4|webm|ogg)(?:\?[^\s]*)?)(?!["')])/gi,
      (match) => {
        const ext = (match.split('.').pop()?.split('?')[0] || 'mp4').toLowerCase();
        const mimeType = ext === 'webm' ? 'video/webm' : ext === 'ogg' ? 'video/ogg' : 'video/mp4';
        return `<div class="content-video">
          <video controls preload="metadata" class="video-player">
            <source src="${match}" type="${mimeType}">
            Your browser does not support the video tag.
          </video>
          <a href="${match}" class="video-download" download>📥 Download</a>
        </div>`;
      }
    );
    return text;
  }

  /**
   * Render YouTube embeds — lazy-loaded with thumbnail placeholder.
   * Covers youtu.be, youtube.com/watch, youtube.com/shorts, and
   * youtube.com/live URLs.
   */
  private renderYouTubeEmbeds(text: string): string {
    // Standard watch / youtu.be / live
    text = text.replace(
      /(?<![("'])(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s"')<]*)/g,
      (_, videoId) => {
        return this.buildYouTubeEmbed(videoId, false);
      }
    );

    // Shorts
    text = text.replace(
      /(?<![("'])(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[^\s"')<]*)/g,
      (_, videoId) => {
        return this.buildYouTubeEmbed(videoId, true);
      }
    );

    return text;
  }

  private buildYouTubeEmbed(videoId: string, isShorts: boolean): string {
    const width = isShorts ? '315' : '100%';
    const height = isShorts ? '560' : '315';
    const thumbClass = isShorts ? 'youtube-shorts' : '';
    return `<div class="youtube-embed ${thumbClass}" data-video-id="${videoId}">
      <div class="youtube-placeholder" onclick="(function(el){var iframe=el.parentElement.querySelector('iframe');iframe.src=iframe.getAttribute('data-src');iframe.style.display='block';el.style.display='none';})(this)">
        <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg"
             alt="YouTube video thumbnail"
             loading="lazy"
             class="youtube-thumbnail"
        />
        <div class="youtube-play-button" aria-label="Play video">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="27" fill="rgba(0,0,0,0.65)" />
            <polygon points="22,18 22,38 40,28" fill="white" />
          </svg>
        </div>
      </div>
      <iframe
        src=""
        data-src="https://www.youtube-nocookie.com/embed/${videoId}"
        style="display:none"
        width="${width}"
        height="${height}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
        title="YouTube video"
      ></iframe>
    </div>`;
  }
}
