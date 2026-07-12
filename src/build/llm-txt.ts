import fs from 'fs';
import path from 'path';
import { ExtractedPage, DepthIndexOptions } from '../types/index.js';

export async function generateLLMText(
  pages: ExtractedPage[],
  options: DepthIndexOptions,
  outDir: string
): Promise<void> {
  const formats = options.llmText.formats;
  const includeMetadata = options.llmText.includeMetadata;

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Generate standard llms.txt (index / table of contents)
  if (formats.includes('txt')) {
    let indexTxt = `# Documentation Index\n\n`;
    indexTxt += `> This file contains the index of all documentation pages for this project.\n\n`;
    indexTxt += `## Pages\n`;

    let fullTxt = `# Complete Documentation\n\n`;
    fullTxt += `This file contains the complete consolidated text content of the documentation.\n\n`;

    pages.forEach(page => {
      const desc = page.frontmatter.description || `Documentation for ${page.title}`;
      indexTxt += `- [${page.title}](${page.url}): ${desc}\n`;

      fullTxt += `--- PAGE START: ${page.title} (${page.url}) ---\n`;
      if (includeMetadata && Object.keys(page.frontmatter).length > 0) {
        fullTxt += `Metadata:\n`;
        Object.entries(page.frontmatter).forEach(([key, val]) => {
          fullTxt += `  ${key}: ${val}\n`;
        });
        fullTxt += `\n`;
      }

      page.sections.forEach(sec => {
        fullTxt += `## ${sec.heading}\n\n${sec.content}\n\n`;
        
        if (options.indexConfig.includeCodeBlocks && sec.codeBlocks.length > 0) {
          sec.codeBlocks.forEach(cb => {
            fullTxt += `\`\`\`${cb.language}\n${cb.code}\n\`\`\`\n\n`;
          });
        }
        if (options.indexConfig.includeMermaid && sec.mermaidDiagrams.length > 0) {
          sec.mermaidDiagrams.forEach(mermaid => {
            fullTxt += `\`\`\`mermaid\n${mermaid}\n\`\`\`\n\n`;
          });
        }
      });
      fullTxt += `--- PAGE END: ${page.title} ---\n\n`;
    });

    fs.writeFileSync(path.join(outDir, 'llms.txt'), indexTxt, 'utf-8');
    fs.writeFileSync(path.join(outDir, 'llms-full.txt'), fullTxt, 'utf-8');
  }

  // 2. Generate llms.jsonl
  if (formats.includes('jsonl')) {
    const jsonlLines = pages.map(page => {
      let pageContent = '';
      page.sections.forEach(sec => {
        pageContent += `## ${sec.heading}\n${sec.content}\n`;
        if (options.indexConfig.includeCodeBlocks) {
          sec.codeBlocks.forEach(cb => {
            pageContent += `\`\`\`${cb.language}\n${cb.code}\n\`\`\`\n`;
          });
        }
        if (options.indexConfig.includeMermaid) {
          sec.mermaidDiagrams.forEach(m => {
            pageContent += `\`\`\`mermaid\n${m}\n\`\`\`\n`;
          });
        }
      });
      return JSON.stringify({
        url: page.url,
        title: page.title,
        metadata: includeMetadata ? page.frontmatter : undefined,
        content: pageContent.trim()
      });
    });

    fs.writeFileSync(path.join(outDir, 'llms.jsonl'), jsonlLines.join('\n'), 'utf-8');
  }

  // 3. Generate llms.md
  if (formats.includes('markdown' as any)) {
    let mdContent = `# Consolidated Documentation\n\n`;
    pages.forEach(page => {
      mdContent += `# ${page.title}\n\n`;
      if (includeMetadata && Object.keys(page.frontmatter).length > 0) {
        mdContent += `**Metadata:**\n`;
        Object.entries(page.frontmatter).forEach(([key, val]) => {
          mdContent += `- **${key}**: ${val}\n`;
        });
        mdContent += `\n`;
      }

      page.sections.forEach(sec => {
        mdContent += `## ${sec.heading}\n\n${sec.content}\n\n`;
        if (options.indexConfig.includeCodeBlocks && sec.codeBlocks.length > 0) {
          sec.codeBlocks.forEach(cb => {
            mdContent += `\`\`\`${cb.language}\n${cb.code}\n\`\`\`\n\n`;
          });
        }
        if (options.indexConfig.includeMermaid && sec.mermaidDiagrams.length > 0) {
          sec.mermaidDiagrams.forEach(m => {
            mdContent += `\`\`\`mermaid\n${m}\n\`\`\`\n\n`;
          });
        }
      });
      mdContent += `---\n\n`;
    });

    fs.writeFileSync(path.join(outDir, 'llms.md'), mdContent, 'utf-8');
  }
}
