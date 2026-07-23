// src/client/markdown-cleaner.ts

export class MarkdownCleaner {
  
  /**
   * Clean and organize markdown for display.
   * Fixes cluttered, unorganized output.
   */
  clean(markdown: string): string {
    if (!markdown) return '';
    let cleaned = markdown;

    // 1. Remove excessive blank lines (more than 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 2. Normalize heading spacing
    cleaned = cleaned.replace(/^(#{1,6})([^#\s])/gm, '$1 $2');

    // 3. Ensure blank line before headings
    cleaned = cleaned.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

    // 4. Ensure blank line before lists
    cleaned = cleaned.replace(/([^\n])\n([-*+]\s)/g, '$1\n\n$2');

    // 5. Remove trailing whitespace
    cleaned = cleaned.replace(/[ \t]+$/gm, '');

    // 6. Fix broken list items (no space after bullet)
    cleaned = cleaned.replace(/^([-*+])([^\s])/gm, '$1 $2');

    // 7. Ensure blank line after code blocks
    cleaned = cleaned.replace(/```\n(?!\n)/g, '```\n\n');

    // 8. Fix duplicate headings
    const seenHeadings = new Set<string>();
    cleaned = cleaned.replace(/^(#{1,6}\s+.+)$/gm, (match) => {
      const normalized = match.toLowerCase().trim();
      if (seenHeadings.has(normalized)) {
        return ''; // Remove duplicate heading
      }
      seenHeadings.add(normalized);
      return match;
    });

    // 10. Collapse excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 11. Ensure single newline at end
    cleaned = cleaned.trim() + '\n';

    return cleaned;
  }

  /**
   * Render markdown to clean HTML.
   */
  renderToHTML(markdown: string): string {
    const cleaned = this.clean(markdown);

    let html = cleaned;

    // Headings
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Unordered lists
    html = html.replace(/^[-*+] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs (text between blank lines)
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><(h[1-4]|ul|ol|pre)/g, '<$1');
    html = html.replace(/<\/(h[1-4]|ul|ol|pre)><\/p>/g, '</$1>');

    return html;
  }
}
