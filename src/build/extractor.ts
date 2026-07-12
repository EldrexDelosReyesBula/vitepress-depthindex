import fs from 'fs';
import path from 'path';
import { ExtractedPage } from '../types/index.js';

// Helper to convert heading text to a URL-friendly slug (similar to VitePress default slugify)
export function slugify(text: string): string {
  // Remove custom anchors e.g. {#custom-id}
  const cleanText = text.replace(/\{#.*?\}/g, '').trim();
  return cleanText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/-+/g, '-') // collapse duplicate hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens
}

// Extract custom heading ID if present (e.g. "## Heading {#custom-id}")
function extractCustomId(headingText: string): { cleanText: string; id: string | null } {
  const match = headingText.match(/(.*?)\s*\{#(.*?)\}/);
  if (match) {
    return {
      cleanText: match[1].trim(),
      id: match[2].trim()
    };
  }
  return {
    cleanText: headingText,
    id: null
  };
}

export function parseMarkdown(content: string, url: string): Omit<ExtractedPage, 'url' | 'lastModified'> {
  let frontmatter: Record<string, any> = {};
  let markdown = content;

  // 1. Parse frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    markdown = content.substring(fmMatch[0].length);
    const fmText = fmMatch[1];
    fmText.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
        frontmatter[key] = value;
      }
    });
  }

  // 2. Parse lines to extract headings, sections, code blocks, mermaid, links
  const lines = markdown.split(/\r?\n/);
  const headings: { level: number; text: string; id: string }[] = [];
  
  interface TempSection {
    heading: string;
    headingId: string;
    contentLines: string[];
    codeBlocks: { language: string; code: string }[];
    mermaidDiagrams: string[];
    links: { text: string; url: string; internal: boolean }[];
  }

  const sections: TempSection[] = [];
  let currentSection: TempSection = {
    heading: frontmatter.title || 'Introduction',
    headingId: '',
    contentLines: [],
    codeBlocks: [],
    mermaidDiagrams: [],
    links: []
  };

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const code = codeContent.join('\n');
        if (codeLanguage === 'mermaid') {
          currentSection.mermaidDiagrams.push(code);
        } else {
          currentSection.codeBlocks.push({ language: codeLanguage, code });
        }
        inCodeBlock = false;
        codeContent = [];
        codeLanguage = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeLanguage = line.trim().replace(/^```/, '').trim().split(/\s+/)[0];
        codeContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const rawText = headingMatch[2].trim();
      const { cleanText, id: customId } = extractCustomId(rawText);
      const slug = slugify(cleanText);
      const headingId = customId || slug;

      headings.push({ level, text: cleanText, id: headingId });

      // Save previous section if it has content
      if (currentSection.contentLines.length > 0 || currentSection.codeBlocks.length > 0 || currentSection.mermaidDiagrams.length > 0) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        heading: cleanText,
        headingId: headingId,
        contentLines: [],
        codeBlocks: [],
        mermaidDiagrams: [],
        links: []
      };
      continue;
    }

    // Extract links in the current line
    // Regex for markdown link: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(line)) !== null) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      const isInternal = !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://') && !linkUrl.startsWith('//');
      currentSection.links.push({ text: linkText, url: linkUrl, internal: isInternal });
    }

    // Add line to current section content (skip empty lines or keep them spaced)
    if (line.trim()) {
      // Remove HTML tags / formatting for cleaner indexing
      const cleanLine = line.replace(/<[^>]*>/g, '').trim();
      if (cleanLine) {
        currentSection.contentLines.push(cleanLine);
      }
    }
  }

  // Push the final section
  if (currentSection.contentLines.length > 0 || currentSection.codeBlocks.length > 0 || currentSection.mermaidDiagrams.length > 0 || sections.length === 0) {
    sections.push(currentSection);
  }

  // Map to final format
  const parsedSections = sections.map(sec => ({
    heading: sec.heading,
    content: sec.contentLines.join(' '),
    codeBlocks: sec.codeBlocks,
    mermaidDiagrams: sec.mermaidDiagrams,
    links: sec.links
  }));

  // Find document title
  let title = frontmatter.title || '';
  if (!title) {
    const h1 = headings.find(h => h.level === 1);
    if (h1) {
      title = h1.text;
    } else if (sections.length > 0) {
      title = sections[0].heading;
    } else {
      title = path.basename(url, '.html');
    }
  }

  return {
    title,
    headings,
    sections: parsedSections,
    frontmatter
  };
}

export async function extractAllPages(
  pages: string[],
  srcDir: string
): Promise<ExtractedPage[]> {
  const extractedPages: ExtractedPage[] = [];

  for (const page of pages) {
    const filePath = path.resolve(srcDir, page);
    if (!fs.existsSync(filePath)) continue;

    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Convert e.g. "guide/index.md" to "/guide/" or "api/cli.md" to "/api/cli.html"
      let url = '/' + page.replace(/\\/g, '/');
      if (url.endsWith('.md')) {
        url = url.substring(0, url.length - 3) + '.html';
      }
      if (url.endsWith('/index.html')) {
        url = url.substring(0, url.length - 10);
      }

      const parsed = parseMarkdown(content, url);
      
      extractedPages.push({
        url,
        lastModified: stats.mtimeMs,
        ...parsed
      });
    } catch (err) {
      console.error(`[depthindex] Failed to extract page ${page}:`, err);
    }
  }

  return extractedPages;
}
