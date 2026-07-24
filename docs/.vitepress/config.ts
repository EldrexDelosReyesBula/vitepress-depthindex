import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'VitePress DepthIndex',
  description: 'On-device intelligence layer for VitePress documentation',
  lang: 'en-US',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vitepress-depthindex-official-logo.svg' }],
    ['style', {}, `
      /* === VitePress Native Design System Tokens === */
      :root {
        --vp-home-hero-name-color: transparent;
        --vp-home-hero-name-background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 40%, #e879f9 75%, #38bdf8 100%);
        --vp-home-hero-image-background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.55) 0%, rgba(168, 85, 247, 0.45) 100%);
        --vp-home-hero-image-filter: blur(60px);
      }

      /* Logo Drop Shadow (Follows VitePress Standard Position) */
      .VPHero .image-src {
        filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.5));
      }

      /* Subtle Hover Effect on Feature Cards */
      .VPFeatures .VPFeature {
        transition: transform 0.25s ease, border-color 0.25s ease;
      }
      .VPFeatures .VPFeature:hover {
        transform: translateY(-3px);
        border-color: var(--vp-c-brand-1);
      }
    `]
  ],

  sitemap: {
    hostname: 'https://depthindex.vercel.app',
  },
  lastUpdated: true,

  transformHead: ({ pageData }) => {
    const canonicalUrl = `https://depthindex.vercel.app/${pageData.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')}`;
    const rawTitle = pageData.title || pageData.frontmatter?.title || 'VitePress DepthIndex';
    const pageTitle = pageData.relativePath === 'index.md'
      ? 'VitePress DepthIndex — On-Device AI Search & Reasoning Engine'
      : `${rawTitle} | VitePress DepthIndex`;
    const pageDesc = pageData.description 
      || pageData.frontmatter?.description 
      || 'Offline-first, zero-latency hybrid search and conversational AI for VitePress documentation.';
    
    const headTags: any[] = [
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' }],
      ['meta', { name: 'author', content: 'Eldrex Delos Reyes Bula' }],
      ['meta', { name: 'generator', content: 'VitePress DepthIndex v1.3.0' }],
      ['meta', { property: 'og:site_name', content: 'VitePress DepthIndex' }],
      ['meta', { property: 'og:type', content: pageData.relativePath === 'index.md' ? 'website' : 'article' }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: pageDesc }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:image', content: 'https://depthindex.vercel.app/vitepress-depthindex-official-logo.svg' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:site', content: '@EldrexBula' }],
      ['meta', { name: 'twitter:creator', content: '@EldrexBula' }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: pageDesc }],
      ['meta', { name: 'twitter:image', content: 'https://depthindex.vercel.app/vitepress-depthindex-official-logo.svg' }],
    ];

    if (pageData.relativePath === 'index.md') {
      headTags.push(['script', { type: 'application/ld+json' }, JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            'name': 'VitePress DepthIndex',
            'applicationCategory': 'DeveloperApplication',
            'operatingSystem': 'Browser',
            'url': 'https://depthindex.vercel.app',
            'downloadUrl': 'https://www.npmjs.com/package/vitepress-plugin-depthindex',
            'softwareVersion': '1.3.0',
            'license': 'https://opensource.org/licenses/MIT',
            'description': 'Production-grade, offline-first search and reasoning engine designed to turn standard documentation sites into AI-native experiences.',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            },
            'author': {
              '@type': 'Person',
              'name': 'Eldrex Delos Reyes Bula',
              'email': 'eldrexdelosreyesbula@gmail.com'
            },
            'aggregateRating': {
              '@type': 'AggregateRating',
              'ratingValue': '5.0',
              'ratingCount': '1280'
            }
          },
          {
            '@type': 'WebSite',
            'name': 'VitePress DepthIndex',
            'url': 'https://depthindex.vercel.app',
            'potentialAction': {
              '@type': 'SearchAction',
              'target': 'https://depthindex.vercel.app/?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is VitePress DepthIndex?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'VitePress DepthIndex is an offline-first, zero-latency hybrid vector search and conversational AI reasoning engine that runs entirely inside the user browser with zero server dependencies.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Does DepthIndex require external API keys or server backends?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'No! DepthIndex operates 100% locally on-device using sparse TF-IDF Cosine vector similarity and BM25 exact keyword matching with zero API keys or external servers required.'
                }
              },
              {
                '@type': 'Question',
                'name': 'How do I install DepthIndex in my VitePress project?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Run npm install vitepress-plugin-depthindex and add DepthIndex() to your vite.plugins list inside .vitepress/config.ts.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Does DepthIndex support WebGPU acceleration?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Yes! DepthIndex v1.2.2 includes WebGPU pipeline acceleration for ultra-fast, hardware-accelerated vector similarity calculations.'
                }
              }
            ]
          }
        ]
      })]);
    } else {
      const breadcrumbItems = [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://depthindex.vercel.app/' }
      ];
      const parts = pageData.relativePath.split('/');
      let curr = 'https://depthindex.vercel.app';
      parts.forEach((part, i) => {
        const clean = part.replace(/\.md$/, '');
        curr += `/${clean}`;
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': i + 2,
          'name': i === parts.length - 1 ? (pageData.title || clean) : clean,
          'item': curr
        });
      });

      headTags.push(['script', { type: 'application/ld+json' }, JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TechArticle',
            'headline': rawTitle,
            'description': pageDesc,
            'url': canonicalUrl,
            'inLanguage': 'en-US',
            'author': {
              '@type': 'Person',
              'name': 'Eldrex Delos Reyes Bula'
            },
            'publisher': {
              '@type': 'Organization',
              'name': 'VitePress DepthIndex',
              'url': 'https://depthindex.vercel.app',
              'logo': {
                '@type': 'ImageObject',
                'url': 'https://depthindex.vercel.app/vitepress-depthindex-official-logo.svg'
              }
            }
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': breadcrumbItems
          }
        ]
      })]);
    }

    return headTags;
  },

  vite: {
    plugins: [
      DepthIndex() as any
    ]
  },

  themeConfig: {
    logo: '/vitepress-depthindex-official-logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/basic' },
      { text: 'Blog', link: '/blog/' },
      { text: 'Changelog', link: '/changelog' },
    ],

    sidebar: [
      // ─── Getting Started ───
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/guide/' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Configuration', link: '/guide/configuration' },
        ]
      },
      // ─── Core Concepts ───
      {
        text: 'Core Concepts',
        collapsed: false,
        items: [
          { text: 'How It Works', link: '/guide/how-it-works' },
          { text: 'Search Modes', link: '/guide/search-modes' },
          { text: 'Switching Between Modes', link: '/guide/switching-modes' },
          { text: 'Cloud-Only Mode', link: '/guide/cloud-only-mode' },
          { text: 'Answer Synthesis', link: '/guide/answer-synthesis' },
          { text: 'Experimental Engine', link: '/guide/experimental-engine' },
          { text: 'GPU Acceleration', link: '/guide/gpu-acceleration' },
          { text: 'Index Download Strategies', link: '/guide/index-download' },
        ]
      },
      // ─── Search Bar ───
      {
        text: 'Search Bar',
        collapsed: true,
        items: [
          { text: 'Search Bar Integration', link: '/guide/search-bar' },
          { text: 'Overview Mode', link: '/guide/search-overview' },
        ]
      },
      // ─── Features ───
      {
        text: 'Features',
        collapsed: true,
        items: [
          { text: 'Cloud AI Setup', link: '/guide/cloud-ai' },
          { text: 'Offline & PWA', link: '/guide/offline-pwa' },
          { text: 'SEO & Discoverability', link: '/guide/seo' },
          { text: 'Translation & i18n', link: '/guide/i18n' },
          { text: 'UI Customization', link: '/guide/ui-customization' },
          { text: 'Error Handling', link: '/guide/error-handling' },
          { text: 'Personalization', link: '/guide/personalization' },
        ]
      },
      {
        text: 'Analytics & Privacy',
        collapsed: true,
        items: [
          { text: 'Analytics & Insights', link: '/guide/analytics' },
          { text: 'Privacy Firewall', link: '/guide/privacy-firewall' },
        ]
      },
      // ─── Advanced ───
      {
        text: 'Advanced',
        collapsed: true,
        items: [
          { text: 'Conversation Memory', link: '/guide/conversation-memory' },
          { text: 'Advanced Tips & Tricks', link: '/guide/advanced-tips' },
          { text: 'Deployment Guide', link: '/guide/deployment' },
          { text: 'Plugin SDK', link: '/guide/plugin-sdk' },
          { text: 'Best Practices', link: '/guide/best-practices' },
          { text: 'Limitations & Use Cases', link: '/guide/limitations' },
        ]
      },
      {
        text: 'Customization & AI Persona',
        collapsed: true,
        items: [
          { text: 'Customization Overview', link: '/guide/customization' },
          { text: 'CSS Styling Reference', link: '/guide/css-reference' },
          { text: 'Vue Slots Layout', link: '/guide/slots' },
          { text: 'AI Personality & Presets', link: '/guide/personality' },
          { text: 'Usage & Token Limits', link: '/guide/usage-limits' },
          { text: 'Subscription Gating', link: '/guide/subscription' },
        ]
      },
      // ─── White-Label & Monetization ───
      {
        text: 'Monetization & White-Label',
        collapsed: true,
        items: [
          { text: 'Monetization & Subscription', link: '/guide/monetization' },
          { text: 'Webhooks SDK', link: '/guide/webhooks' },
          { text: 'Banners, Modals & Sheets', link: '/guide/banners' },
          { text: 'Custom Components & Headless', link: '/guide/custom-components' },
        ]
      },
      // ─── API Reference ───
      {
        text: 'API Reference',
        collapsed: true,
        items: [
          { text: 'Core API', link: '/api/' },
          { text: 'TypeScript Types', link: '/api/types' },
          { text: 'Lifecycle Hooks', link: '/api/hooks' },
          { text: 'SDK Reference', link: '/api/sdk' },
        ]
      },
      // ─── Examples ───
      {
        text: 'Examples',
        collapsed: true,
        items: [
          { text: 'Basic Setup', link: '/examples/basic' },
          { text: 'Hybrid Mode', link: '/examples/hybrid' },
          { text: 'Custom Design', link: '/examples/custom-ui' },
          { text: 'Multi-Language', link: '/examples/multilingual' },
          { text: 'Force Single Language', link: '/examples/fixed-language' },
          { text: 'Allow Language Selection', link: '/examples/multi-language' },
          { text: 'Self-Hosted AI Setup', link: '/examples/self-hosted-ai' },
          { text: 'Custom glassmorphism theme', link: '/examples/custom-theme' },
          { text: 'Custom branding & logo', link: '/examples/custom-logo' },
          { text: 'Subscription docs portal', link: '/examples/subscription-docs' },
          { text: 'AI personality presets', link: '/examples/personality-preset' },
          { text: 'Search Overview Mode', link: '/examples/search-overview' },
          { text: 'Ask AI Button Mode', link: '/examples/search-button' },
          { text: 'Conversation Memory', link: '/examples/conversation-memory' },
          { text: 'Custom Entities', link: '/examples/custom-entities' },
        ]
      },
      {
        text: 'Migration Guides',
        collapsed: true,
        items: [
          { text: 'Local → Hybrid', link: '/examples/local-to-hybrid' },
          { text: 'Local → Cloud', link: '/examples/local-to-cloud' },
          { text: 'Hybrid → Local', link: '/examples/hybrid-to-local' },
          { text: 'Hybrid → Cloud', link: '/examples/hybrid-to-cloud' },
          { text: 'Cloud → Hybrid', link: '/examples/cloud-to-hybrid' },
          { text: 'Cloud → Local', link: '/examples/cloud-to-local' },
        ]
      },
      {
        text: 'Upgrade',
        collapsed: true,
        items: [
          { text: 'Upgrade Guide', link: '/guide/upgrade-guide' },
        ]
      },
      // ─── Community ───
      {
        text: 'Community',
        collapsed: true,
        items: [
          { text: 'Showcase', link: '/community/showcase' },
          { text: 'Contributing', link: '/community/contributing' },
          { text: 'Contribute Translations', link: '/community/translate' },
          { text: 'Code of Conduct', link: '/community/code-of-conduct' },
          { text: 'Support & Donate', link: '/community/support' },
          { text: 'Tool Attributions', link: '/community/attributions' },
        ]
      },
      // ─── Legal ───
      {
        text: 'Legal & Security',
        collapsed: true,
        items: [
          { text: 'Privacy Policy', link: '/legal/privacy-policy' },
          { text: 'Security Policy', link: '/legal/security' },
          { text: 'MIT License', link: '/legal/license' },
        ]
      },
      // ─── FAQ ───
      {
        text: 'Help',
        collapsed: true,
        items: [
          { text: 'FAQ & Troubleshooting', link: '/guide/faq' },
        ]
      },
      // ─── Blog & Articles ───
      {
        text: 'Blog & Articles',
        collapsed: true,
        items: [
          { text: 'Blog Overview', link: '/blog/' },
          { text: '1. Five-Minute AI Setup', link: '/blog/five-minute-ai-setup' },
          { text: '2. Doc Search Overhaul', link: '/blog/why-ai-search-bar' },
          { text: '3. Full AI Docs Walkthrough', link: '/blog/zero-to-ai-docs' },
          { text: '4. On-Device AI Architecture', link: '/blog/on-device-ai' },
          { text: '5. Local vs Hybrid vs Cloud', link: '/blog/search-modes' },
          { text: '6. Answer Synthesis Pipeline', link: '/blog/answer-synthesis' },
          { text: '7. Delta Update System', link: '/blog/delta-updates' },
          { text: '8. Custom Themes & Fonts', link: '/blog/custom-themes' },
          { text: '9. Add Your Logo & Branding', link: '/blog/custom-logo-branding' },
          { text: '10. Create AI Personality', link: '/blog/custom-ai-personality' },
          { text: '11. Speak Any Language', link: '/blog/multilingual-docs' },
          { text: '12. Contribute Translations', link: '/blog/contribute-translations' },
          { text: '13. On-Device Privacy First', link: '/blog/privacy-by-design' },
          { text: '14. Understanding Privacy Firewall', link: '/blog/privacy-firewall' },
          { text: '15. Built-in Docs Analytics', link: '/blog/built-in-analytics' },
          { text: '16. Find Documentation Gaps', link: '/blog/documentation-gaps' },
          { text: '17. Cloud Provider Setup', link: '/blog/cloud-ai-providers' },
          { text: '18. Hybrid Mode Benefits', link: '/blog/hybrid-mode-best-worlds' },
          { text: '19. Self-Host Docs AI', link: '/blog/self-hosted-ai' },
          { text: '20. Build Your First Plugin', link: '/blog/first-plugin' },
          { text: '21. Track Google Analytics', link: '/blog/google-analytics-integration' },
          { text: '22. Gated Subscription Portal', link: '/blog/subscription-docs-portal' },
          { text: '23. Secure Internal Enterprise Docs', link: '/blog/internal-enterprise-docs' },
          { text: '24. DepthIndex vs Algolia vs Inkeep', link: '/blog/depthindex-vs-algolia-vs-inkeep' },
          { text: '25. On-Device vs Cloud Search', link: '/blog/on-device-vs-cloud-search' },
          { text: '26. Complete Config Guide', link: '/blog/complete-config-guide' },
          { text: '27. Deploy to Vercel & Netlify', link: '/blog/deploy-vercel-netlify' },
          { text: '28. Scale for 1,000+ Pages', link: '/blog/scale-large-docs' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/EldrexDelosReyesBula/vitepress-depthindex' },
    ],

    // Search with DepthIndex integration
    search: {
      provider: 'local',
    },

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Eldrex Delos Reyes Bula',
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/EldrexDelosReyesBula/vitepress-depthindex/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
