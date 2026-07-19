// src/client/rich-text-renderer.ts

export class RichTextRenderer {
  
  render(markdown: string): string {
    let html = markdown;
    
    // Blockquote
    html = html.replace(/^>\s?(.+)$/gm, '<blockquote class="di-blockquote">$1</blockquote>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Underline (ignoring uppercase placeholders like __DEPTHINDEX_ or __HTML_)
    html = html.replace(/__(?!(?:[A-Z]+)_)(.+?)__/g, '<u>$1</u>');
    
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="di-inline-code">$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="di-link">$1</a>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (_, lang, code) => {
      const escaped = this.escapeHtml(code.trim());
      return `<pre class="di-code-block"><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
    });
    
    // Tables
    html = this.renderTables(html);
    
    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    
    return html;
  }
  
  private renderTables(html: string): string {
    return html.replace(
      /\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g,
      (_, header, body) => {
        const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
        const rows = body.trim().split('\n').map((row: string) =>
          row.split('|').map((c: string) => c.trim()).filter(Boolean)
        );
        let table = '<div class="di-table-wrapper"><table class="di-table"><thead><tr>';
        headers.forEach((h: string) => { table += `<th>${h}</th>`; });
        table += '</tr></thead><tbody>';
        rows.forEach((row: string[]) => {
          if (row.length > 0) {
            table += '<tr>';
            row.forEach((cell: string) => { table += `<td>${cell}</td>`; });
            table += '</tr>';
          }
        });
        table += '</tbody></table></div>';
        return table;
      }
    );
  }
  
  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
