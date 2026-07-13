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
        this.mermaidObj.initialize({
          startOnLoad: false,
          theme: 'default',
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
   * Main async render method
   */
  async renderMarkdown(text: string): Promise<string> {
    if (!text) return '';

    const blocks: RenderBlock[] = [];
    let processed = text;

    // Phase 1: Extract block-level special components (protect them from inline rendering)
    processed = this.extractMermaidBlocks(processed, blocks);
    processed = this.extractMathBlocks(processed, blocks);
    processed = this.extractCodeBlocks(processed, blocks);

    // Phase 2: Render the remaining text as Markdown
    let rendered = this.renderMarkdownToHtml(processed);

    // Media Rendering enhancements
    rendered = this.renderImages(rendered);
    rendered = this.renderVideos(rendered);
    rendered = this.renderYouTubeEmbeds(rendered);

    // Phase 3: Restore async blocks (code, mermaid, math)
    rendered = await this.replaceAsyncBlocks(rendered, blocks);

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
   * Proper Markdown-to-HTML renderer. Processes the text block by block,
   * then handles inline formatting within each block.
   */
  private renderMarkdownToHtml(text: string): string {
    const lines = text.split('\n');
    const outputBlocks: string[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Pass through placeholder lines untouched
      if (line.trim().startsWith('__DEPTHINDEX_')) {
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

      // ATX Headings
      const h1 = line.match(/^# (.+)/);
      const h2 = line.match(/^## (.+)/);
      const h3 = line.match(/^### (.+)/);
      const h4 = line.match(/^#### (.+)/);
      if (h4) { outputBlocks.push(`<h4 class="md-h4">${this.renderInline(h4[1])}</h4>`); i++; continue; }
      if (h3) { outputBlocks.push(`<h3 class="md-h3">${this.renderInline(h3[1])}</h3>`); i++; continue; }
      if (h2) { outputBlocks.push(`<h2 class="md-h2">${this.renderInline(h2[1])}</h2>`); i++; continue; }
      if (h1) { outputBlocks.push(`<h2 class="md-h1">${this.renderInline(h1[1])}</h2>`); i++; continue; }

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
        outputBlocks.push(`<blockquote class="md-blockquote">${parts.join('<br>')}</blockquote>`);
        continue;
      }

      // Empty line — paragraph break
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Regular paragraph — collect consecutive non-empty, non-special lines
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('__DEPTHINDEX_') &&
        !/^#{1,6} /.test(lines[i]) &&
        !/^[ \t]*[-*+] /.test(lines[i]) &&
        !/^[ \t]*\d+\. /.test(lines[i]) &&
        !/^> /.test(lines[i]) &&
        !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }
      if (paragraphLines.length > 0) {
        const content = paragraphLines.map(l => this.renderInline(l)).join('<br>');
        outputBlocks.push(`<p class="md-p">${content}</p>`);
      }
    }

    return outputBlocks.join('\n');
  }

  /**
   * Renders inline Markdown: bold, italic, strikethrough, inline code, links, math
   */
  private renderInline(text: string): string {
    let s = text;

    // Protect inline code first (avoid applying other formatting inside)
    const inlineCodeMap: Record<string, string> = {};
    s = s.replace(/`([^`]+)`/g, (_, code) => {
      const key = `__ICODE_${Object.keys(inlineCodeMap).length}__`;
      inlineCodeMap[key] = `<code class="md-inline-code">${this.escapeHtml(code)}</code>`;
      return key;
    });

    // Inline math $...$
    s = s.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
      return this.renderMathSync(expr.trim());
    });

    // Bold+italic ***text***
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text* (single asterisk, not inside words)
    s = s.replace(/(^|[\s([{])_([^_]+)_([\s)\]},.]|$)/g, '$1<em>$2</em>$3');
    s = s.replace(/(^|[\s([{])\*([^*\n]+)\*([\s)\]},.]|$)/g, '$1<em>$2</em>$3');
    // Strikethrough ~~text~~
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links [text](url) — internal doc links get router-friendly class
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const isInternal = url.startsWith('/') && !url.startsWith('//');
      if (isInternal) {
        return `<a href="${url}" class="md-link md-link-internal">${label}</a>`;
      }
      return `<a href="${url}" class="md-link" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });

    // Restore inline code
    for (const [key, val] of Object.entries(inlineCodeMap)) {
      s = s.replace(key, val);
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
        <div class="mermaid-diagram" id="${id}" data-diagram="${this.escapeHtml(diagramCode)}">
          <pre class="language-mermaid"><code>${this.escapeHtml(diagramCode)}</code></pre>
        </div>
      </div>`;
    }
    try {
      const { svg } = await Promise.race([
        this.mermaidObj.render(id, diagramCode.trim()),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ]);
      return `<div class="mermaid-container">
        <div class="mermaid-diagram rendered" id="${id}" data-diagram="${this.escapeHtml(diagramCode)}">${svg}</div>
        <details class="mermaid-source">
          <summary>View diagram source</summary>
          <pre><code class="language-mermaid">${this.escapeHtml(diagramCode)}</code></pre>
        </details>
      </div>`;
    } catch (error: any) {
      console.warn('[DepthIndex] Mermaid render failed:', error.message || error);
      return `<div class="mermaid-fallback">
        <div class="mermaid-error-banner">Unable to render diagram</div>
        <details class="mermaid-source">
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
        return `<code class="math-error" title="${this.escapeHtml(err.message)}">${this.escapeHtml(expression)}</code>`;
      }
    }
    return displayMode
      ? `<div class="math-display math-loading" data-math="${this.escapeHtml(expression)}">$$\n${this.escapeHtml(expression)}\n$$</div>`
      : `<span class="math-inline math-loading" data-math="${this.escapeHtml(expression)}">${this.escapeHtml(expression)}</span>`;
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
    return `<span class="math-inline math-loading" data-math="${this.escapeHtml(expression)}">${this.escapeHtml(expression)}</span>`;
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
        .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|interface|type|enum|import|export|from|as|default|async|await|try|catch|finally|new|throw|typeof|instanceof|void|never|any|string|number|boolean|null|undefined)\b/g,
          '<span class="tok-kw">$1</span>')
        .replace(/\b(true|false)\b/g, '<span class="tok-bool">$1</span>')
        .replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
        .replace(/'([^'\\]|\\.)*'/g, '<span class="tok-str">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="tok-str">$&</span>')
        .replace(/`([^`\\]|\\.)*`/g, '<span class="tok-str">$&</span>');
    }
    if (['bash', 'sh', 'shell', 'zsh'].includes(lang)) {
      return escaped
        .replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>')
        .replace(/\b(npm|npx|pnpm|yarn|git|cd|ls|mkdir|rm|cp|mv|echo|export|source)\b/g,
          '<span class="tok-kw">$1</span>');
    }
    if (['json'].includes(lang)) {
      return escaped
        .replace(/"([^"]+)"(\s*:)/g, '<span class="tok-key">"$1"</span>$2')
        .replace(/:\s*"([^"]+)"/g, ': <span class="tok-str">"$1"</span>')
        .replace(/\b(true|false|null)\b/g, '<span class="tok-bool">$1</span>');
    }
    if (['css', 'scss'].includes(lang)) {
      return escaped
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
        .replace(/([.#][\w-]+)\s*\{/g, '<span class="tok-kw">$1</span> {')
        .replace(/([\w-]+)\s*:/g, '<span class="tok-key">$1</span>:');
    }
    return escaped;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Render images with lightbox support
   */
  private renderImages(text: string): string {
    // Standard markdown images
    text = text.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_, alt, src) => {
        return `<figure class="content-image">
          <img src="${src}" alt="${alt}" loading="lazy" 
               onclick="this.closest('.content-image').classList.toggle('expanded')"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
          />
          <div class="image-error" style="display:none">
            <span class="icon">🖼️</span>
            <span>Image unavailable: ${this.escapeHtml(src)}</span>
          </div>
          ${alt ? `<figcaption>${this.escapeHtml(alt)}</figcaption>` : ''}
        </figure>`;
      }
    );
    
    // Direct image URLs (not in markdown format)
    text = text.replace(
      /(?<!["'(])(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|svg|webp)(?:\?[^\s]*)?)(?!["')])/gi,
      (match) => {
        return `<img src="${match}" alt="Image" loading="lazy" class="inline-image" 
                     onerror="this.style.display='none'" />`;
      }
    );
    
    return text;
  }
  
  /**
   * Render video embeds
   */
  private renderVideos(text: string): string {
    // Direct video URLs
    text = text.replace(
      /(?<!["'(])(https?:\/\/[^\s]+\.(?:mp4|webm|ogg)(?:\?[^\s]*)?)(?!["')])/gi,
      (match) => {
        const fileExt = match.split('.').pop()?.split('?')[0] || 'mp4';
        return `<div class="content-video">
          <video controls preload="metadata" class="video-player">
            <source src="${match}" type="video/${fileExt}">
            Your browser does not support the video tag.
          </video>
          <a href="${match}" class="video-download" download>📥 Download</a>
        </div>`;
      }
    );
    
    return text;
  }
  
  /**
   * Render YouTube embeds
   */
  private renderYouTubeEmbeds(text: string): string {
    // YouTube watch URLs
    text = text.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)/g,
      (_, videoId) => {
        return `<div class="youtube-embed" data-video-id="${videoId}">
          <div class="youtube-placeholder" onclick="this.parentElement.querySelector('iframe').style.display='block';this.style.display='none';this.parentElement.querySelector('iframe').src=this.parentElement.querySelector('iframe').getAttribute('data-src')">
            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" 
                 alt="YouTube video thumbnail" 
                 loading="lazy"
                 class="youtube-thumbnail"
            />
            <div class="youtube-play-button">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="white">
                <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.6)"/>
                <polygon points="18,14 18,34 34,24" fill="white"/>
              </svg>
            </div>
          </div>
          <iframe 
            src="" 
            data-src="https://www.youtube-nocookie.com/embed/${videoId}"
            style="display:none"
            width="100%" 
            height="315" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>`;
      }
    );
    
    // YouTube short URLs
    text = text.replace(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[^\s]*)/g,
      (_, videoId) => {
        return `<div class="youtube-embed youtube-shorts" data-video-id="${videoId}">
          <div class="youtube-placeholder" onclick="this.parentElement.querySelector('iframe').style.display='block';this.style.display='none';this.parentElement.querySelector('iframe').src=this.parentElement.querySelector('iframe').getAttribute('data-src')">
            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" 
                 alt="YouTube Shorts thumbnail" 
                 loading="lazy"
            />
            <div class="youtube-play-button">▶</div>
          </div>
          <iframe 
            src=""
            data-src="https://www.youtube-nocookie.com/embed/${videoId}"
            style="display:none"
            width="315" 
            height="560" 
            frameborder="0"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>`;
      }
    );
    
    return text;
  }
}
