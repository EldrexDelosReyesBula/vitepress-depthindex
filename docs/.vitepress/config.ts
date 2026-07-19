import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'VitePress DepthIndex',
  description: 'On-device intelligence layer for VitePress documentation',
  lang: 'en-US',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vitepress-depthindex-official-logo.svg' }]
  ],

  vite: {
    plugins: [
      DepthIndex({
        seo: {
          siteUrl: 'https://depthindex.vercel.app',
          siteName: 'VitePress DepthIndex',
          siteDescription: 'On-device intelligence layer for VitePress documentation — offline-first AI search engine',
          author: 'Eldrex Delos Reyes Bula',
          twitterHandle: '@EldrexBula',
          defaultImage: '/depthindex-wordmark.png',
          aiCrawlerPolicy: 'allow',
        }
      }) as any
    ]
  },

  themeConfig: {
    logo: '/vitepress-depthindex-official-logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/basic' },
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
          { text: 'Answer Synthesis', link: '/guide/answer-synthesis' },
          { text: 'Search Bar Integration', link: '/guide/search-bar' },
        ]
      },
      {
        text: 'Search Modes',
        collapsed: true,
        items: [
          { text: 'Search Modes Overview', link: '/guide/search-modes' },
          { text: 'Switching Between Modes', link: '/guide/switching-modes' },
          { text: 'Cloud-Only Mode', link: '/guide/cloud-only-mode' },
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
