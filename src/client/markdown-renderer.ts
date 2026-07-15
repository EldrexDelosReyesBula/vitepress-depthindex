export class MarkdownRenderer {
  
  render(md: string): string {
    let html = md;
    
    // Tables
    html = this.renderTables(html);
    
    // Code blocks (must come before inline code)
    html = this.renderCodeBlocks(html);
    
    // Blockquotes
    html = this.renderBlockquotes(html);
    
    // Headings
    html = this.renderHeadings(html);
    
    // Lists
    html = this.renderLists(html);
    
    // Horizontal rules
    html = this.renderHorizontalRules(html);
    
    // Inline formatting
    html = this.renderInline(html);
    
    // Links
    html = this.renderLinks(html);
    
    return html;
  }
  
  private renderTables(html: string): string {
    return html.replace(
      /\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g,
      (match, header, body) => {
        const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
        const rows = body.trim().split('\n').map((row: string) =>
          row.split('|').map((c: string) => c.trim()).filter(Boolean)
        );
        
        let table = '<div class="di-table-wrapper"><table class="di-table">';
        
        // Header
        table += '<thead><tr>';
        headers.forEach((h: string) => {
          table += `<th>${this.renderInline(h)}</th>`;
        });
        table += '</tr></thead>';
        
        // Body
        table += '<tbody>';
        rows.forEach((row: string[]) => {
          if (row.length > 0) {
            table += '<tr>';
            row.forEach(cell => {
              table += `<td>${this.renderInline(cell)}</td>`;
            });
            table += '</tr>';
          }
        });
        table += '</tbody></table></div>';
        
        return table;
      }
    );
  }
  
  private renderCodeBlocks(html: string): string {
    return html.replace(
      /```(\w+)?\s*\n([\s\S]*?)```/g,
      (match, lang, code) => {
        const language = lang || 'text';
        const escaped = this.escapeHtml(code.trim());
        const highlighted = this.highlight(escaped, language);
        
        return `<div class="di-code">
          <div class="di-code-header">
            <span class="di-code-lang">${language}</span>
            <button class="di-code-copy" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent)">
              <i class="fa-regular fa-copy"></i> Copy
            </button>
          </div>
          <pre class="di-code-pre"><code class="language-${language}">${highlighted}</code></pre>
        </div>`;
      }
    );
  }
  
  private highlight(code: string, lang: string): string {
    // Keywords
    if (['ts', 'typescript', 'js', 'javascript'].includes(lang)) {
      code = code.replace(
        /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|enum|async|await|try|catch|throw|new|extends|implements|readonly|private|public|protected)\b/g,
        '<span class="di-token-keyword">$1</span>'
      );
      code = code.replace(
        /\b(true|false|null|undefined)\b/g,
        '<span class="di-token-boolean">$1</span>'
      );
      code = code.replace(
        /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g,
        '<span class="di-token-string">$1</span>'
      );
      code = code.replace(
        /(\/\/.*$)/gm,
        '<span class="di-token-comment">$1</span>'
      );
    }
    
    if (['bash', 'sh', 'shell'].includes(lang)) {
      code = code.replace(/^(#.*$)/gm, '<span class="di-token-comment">$1</span>');
      code = code.replace(
        /\b(npm|pnpm|yarn|node|git|docker|cd|ls|mkdir|rm|cp|mv|echo|cat|export)\b/g,
        '<span class="di-token-builtin">$1</span>'
      );
    }
    
    return code;
  }
  
  private renderInline(html: string): string {
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="di-inline-code">$1</code>');
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    return html;
  }
  
  private renderLinks(html: string): string {
    return html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="di-link">$1</a>'
    );
  }

  private renderBlockquotes(html: string): string {
    const lines = html.split('\n');
    let inQuote = false;
    let result = '';
    
    for (let line of lines) {
      if (line.trim().startsWith('>')) {
        const content = line.substring(line.indexOf('>') + 1).trim();
        if (!inQuote) {
          result += '<blockquote>' + content;
          inQuote = true;
        } else {
          result += '\n' + content;
        }
      } else {
        if (inQuote) {
          result += '</blockquote>\n';
          inQuote = false;
        }
        result += line + '\n';
      }
    }
    if (inQuote) {
      result += '</blockquote>';
    }
    return result;
  }

  private renderHeadings(html: string): string {
    return html
      .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  }

  private renderLists(html: string): string {
    // Unordered lists
    html = html.replace(/^(?:\s*[-*+]\s+(.*?)(?:\n|$))+/gm, (match) => {
      const items = match.trim().split('\n').map(li => `<li>${li.replace(/^\s*[-*+]\s+/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });
    
    // Ordered lists
    html = html.replace(/^(?:\s*\d+\.\s+(.*?)(?:\n|$))+/gm, (match) => {
      const items = match.trim().split('\n').map(li => `<li>${li.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    return html;
  }

  private renderHorizontalRules(html: string): string {
    return html.replace(/^---+\s*$/gm, '<hr class="di-hr" />');
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
