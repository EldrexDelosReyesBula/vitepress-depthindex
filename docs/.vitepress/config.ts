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
      /* === Landing Page Ambient Mesh & Hero Styling === */
      .VPHero {
        position: relative !important;
        padding: 64px 24px 48px !important;
        background: radial-gradient(circle at 75% 35%, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.12) 35%, rgba(56, 189, 248, 0.05) 60%, transparent 80%),
                    radial-gradient(circle at 15% 75%, rgba(168, 85, 247, 0.12) 0%, transparent 50%) !important;
      }
      
      .VPHero .name {
        font-size: 42px !important;
        font-weight: 900 !important;
        letter-spacing: -0.02em !important;
        line-height: 1.15 !important;
        background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 40%, #e879f9 75%, #38bdf8 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        display: inline-block !important;
        margin-bottom: 6px !important;
      }
      
      .VPHero .text {
        font-size: 24px !important;
        font-weight: 700 !important;
        line-height: 1.3 !important;
        background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        margin-bottom: 16px !important;
      }
      
      .VPHero .tagline {
        font-size: 17px !important;
        color: #94a3b8 !important;
        line-height: 1.6 !important;
        max-width: 620px !important;
        margin-bottom: 28px !important;
      }

      /* === Hero Logo Backdrop Halo & Glowing Mesh === */
      .VPHero .image {
        position: relative !important;
      }
      .VPHero .image-container {
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .VPHero .image-bg {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 320px !important;
        height: 320px !important;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.55) 0%, rgba(168, 85, 247, 0.45) 45%, rgba(56, 189, 248, 0.25) 70%, transparent 100%) !important;
        filter: blur(55px) !important;
        border-radius: 50% !important;
        z-index: 0 !important;
        pointer-events: none !important;
        animation: hero-glow-pulse 5s ease-in-out infinite alternate !important;
      }
      @keyframes hero-glow-pulse {
        0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.85; }
        100% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
      }
      .VPHero .image-src {
        position: relative !important;
        z-index: 1 !important;
        max-width: 320px !important;
        max-height: 320px !important;
        filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 25px rgba(99, 102, 241, 0.4)) !important;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .VPHero .image-src:hover {
        transform: translateY(-8px) scale(1.04) !important;
      }

      /* === Hero Action Buttons === */
      .VPHero .action .VPButton.brand {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4) !important;
        font-weight: 600 !important;
        border-radius: 12px !important;
        transition: all 0.25s ease !important;
      }
      .VPHero .action .VPButton.brand:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.6) !important;
      }
      .VPHero .action .VPButton.alt {
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        background: rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(8px) !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        transition: all 0.25s ease !important;
      }
      .VPHero .action .VPButton.alt:hover {
        background: rgba(255, 255, 255, 0.12) !important;
        border-color: rgba(168, 85, 247, 0.4) !important;
        transform: translateY(-2px) !important;
      }

      /* === Feature Cards Glassmorphism === */
      .VPFeatures {
        padding: 48px 24px 64px !important;
        max-width: 1152px !important;
        margin: 0 auto !important;
      }
      .VPFeatures .VPFeature {
        background: rgba(30, 31, 46, 0.6) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 16px !important;
        padding: 24px !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .VPFeatures .VPFeature:hover {
        transform: translateY(-5px) !important;
        border-color: rgba(168, 85, 247, 0.4) !important;
        box-shadow: 0 16px 32px -8px rgba(99, 102, 241, 0.25) !important;
        background: rgba(36, 38, 58, 0.8) !important;
      }
      .VPFeatures .VPFeature .icon {
        font-size: 24px !important;
        margin-bottom: 14px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 48px !important;
        height: 48px !important;
        border-radius: 12px !important;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)) !important;
        border: 1px solid rgba(168, 85, 247, 0.3) !important;
      }
      .VPFeatures .VPFeature .title {
        font-size: 18px !important;
        font-weight: 700 !important;
        color: #f8fafc !important;
        margin-bottom: 8px !important;
      }
      .VPFeatures .VPFeature .details {
        font-size: 14px !important;
        color: #94a3b8 !important;
        line-height: 1.6 !important;
      }

      /* === Home Content Container === */
      .VPHome .vp-doc {
        max-width: 1152px !important;
        margin: 0 auto !important;
        padding: 48px 24px !important;
        border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      .VPHome .vp-doc h2 {
        border-top: none !important;
        font-size: 26px !important;
        font-weight: 800 !important;
        margin-top: 36px !important;
        margin-bottom: 16px !important;
        background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
      }
    `]
  ],

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
