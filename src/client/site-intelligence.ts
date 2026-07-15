import { SiteProfile, PageContext, DocStructure } from '../types/index.js';

export class SiteIntelligence {
  private cachedProfile: SiteProfile | null = null;
  
  /**
   * Automatically learn everything about the site.
   * Zero hardcoded knowledge. Everything from DOM.
   */
  analyze(): SiteProfile {
    if (this.cachedProfile) return this.cachedProfile;
    
    const profile: SiteProfile = {
      name: this.detectSiteName(),
      description: this.detectDescription(),
      type: this.detectType(),
      structure: this.detectStructure(),
      topics: this.detectTopics(),
      currentPage: this.detectCurrentPage(),
    };
    
    this.cachedProfile = profile;
    return profile;
  }
  
  /**
   * Detect site name from multiple sources
   */
  private detectSiteName(): string {
    if (typeof document === 'undefined') return 'Documentation';

    // 1. VitePress theme title
    const navTitle = document.querySelector('.VPNavBarTitle .title');
    if (navTitle?.textContent) {
      return navTitle.textContent.trim();
    }
    
    // 2. Open Graph site name
    const ogSite = document.querySelector('meta[property="og:site_name"]');
    if (ogSite?.getAttribute('content')) {
      return ogSite.getAttribute('content')!.trim();
    }
    
    // 3. Logo alt text
    const logo = document.querySelector('.VPImage.logo, .VPNavBarTitle img');
    if (logo?.getAttribute('alt')) {
      return logo.getAttribute('alt')!.trim();
    }
    
    // 4. Title tag
    const title = document.querySelector('title');
    if (title?.textContent) {
      const parts = title.textContent.split(/[|–—•·-]/);
      return parts[parts.length - 1].trim();
    }
    
    return 'Documentation';
  }

  /**
   * Detect description from meta tag or hero section
   */
  private detectDescription(): string {
    if (typeof document === 'undefined') return '';

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc?.getAttribute('content')) {
      return ogDesc.getAttribute('content')!.trim();
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc?.getAttribute('content')) {
      return metaDesc.getAttribute('content')!.trim();
    }

    const heroText = document.querySelector('.VPHero .tagline');
    if (heroText?.textContent) {
      return heroText.textContent.trim();
    }

    return 'Documentation site';
  }

  /**
   * Detect site type (library, api, tool, product, guide)
   */
  private detectType(): 'library' | 'api' | 'tool' | 'other' {
    if (typeof document === 'undefined') return 'other';

    const text = document.body.textContent?.toLowerCase() || '';
    if (text.includes('npm install') || text.includes('yarn add') || text.includes('pnpm add')) {
      return 'library';
    }
    if (text.includes('api reference') || text.includes('endpoints') || text.includes('rest api')) {
      return 'api';
    }
    if (text.includes('cli') || text.includes('command line') || text.includes('config file')) {
      return 'tool';
    }
    return 'library'; // default fallback as VitePress is mostly dev libraries/guides
  }
  
  /**
   * Detect current page context
   */
  private detectCurrentPage(): PageContext {
    if (typeof document === 'undefined') {
      return { title: '', section: '', relatedPages: [] };
    }

    // Get current page title
    const h1 = document.querySelector('.VPContent h1, main h1');
    const title = h1?.textContent?.trim() || document.title?.split(/[|–—•·-]/)[0]?.trim() || '';
    
    // Get page section from sidebar active item
    const activeLink = document.querySelector('.VPSidebarItem.is-active .text');
    const section = activeLink?.textContent?.trim() || '';
    
    // Get related pages from sidebar
    const sidebarLinks = document.querySelectorAll('.VPSidebarItem .VPLink');
    const relatedPages: string[] = [];
    sidebarLinks.forEach(link => {
      const text = link.querySelector('.text')?.textContent?.trim();
      if (text && text !== section) relatedPages.push(text);
    });
    
    return { title, section, relatedPages };
  }
  
  /**
   * Detect documentation structure from sidebar
   */
  private detectStructure(): DocStructure {
    const groups: { header: string; items: string[] }[] = [];
    if (typeof document === 'undefined') return { groups };
    
    const sidebarGroups = document.querySelectorAll('.VPSidebarItem .items');
    sidebarGroups.forEach(group => {
      const parentItem = group.closest('.VPSidebarItem');
      const header = parentItem?.querySelector('.text')?.textContent?.trim() || '';
      const items: string[] = [];
      
      group.querySelectorAll('.VPLink .text').forEach(link => {
        const text = link.textContent?.trim();
        if (text) items.push(text);
      });
      
      if (header || items.length > 0) {
        groups.push({ header, items });
      }
    });
    
    return { groups };
  }

  /**
   * Detect topics
   */
  private detectTopics(): string[] {
    const topics: string[] = [];
    if (typeof document === 'undefined') return topics;

    const headings = document.querySelectorAll('.VPContent h2, main h2');
    headings.forEach(h => {
      const text = h.textContent?.trim();
      if (text) topics.push(text);
    });

    return topics.slice(0, 10);
  }
  
  /**
   * Detect what the user might want based on current page
   */
  suggestQuestions(): string[] {
    const profile = this.analyze();
    const questions: string[] = [];
    
    // Based on current page
    if (profile.currentPage.title) {
      questions.push(`Summarize this page`);
      questions.push(`Explain "${profile.currentPage.title}" in simple terms`);
    }
    
    // Based on sidebar structure
    const firstGroup = profile.structure.groups[0];
    if (firstGroup?.header?.toLowerCase().includes('getting') || 
        firstGroup?.header?.toLowerCase().includes('start')) {
      // Site has a Getting Started section
      const firstItem = firstGroup.items[0];
      if (firstItem) questions.push(`What is ${profile.name}?`);
    }
    
    // Based on site type
    switch (profile.type) {
      case 'library':
        questions.push('How do I install this?');
        questions.push('Show me a basic example');
        break;
      case 'api':
        questions.push('How do I authenticate?');
        questions.push('What endpoints are available?');
        break;
      case 'tool':
        questions.push('How do I use the CLI?');
        questions.push('What commands are available?');
        break;
    }
    
    // Always include
    if (!questions.includes('How do I get started?')) {
      questions.push('How do I get started?');
    }
    
    return questions.slice(0, 5);
  }
  
  /**
   * Generate contextual greeting
   */
  generateGreeting(): string {
    const profile = this.analyze();
    
    // Short greeting for compact panel
    if (profile.currentPage.title) {
      return `Reading **${profile.currentPage.title}**. Ask me anything about this page or the docs.`;
    }
    
    return `Ask me anything about **${profile.name}**.`;
  }
}
