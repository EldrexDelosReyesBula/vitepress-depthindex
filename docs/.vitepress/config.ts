import { defineConfig } from 'vitepress';
import DepthIndex from '../../dist/index.js';

export default defineConfig({
  title: 'VitePress DepthIndex',
  description: 'On-device intelligence layer for VitePress documentation',
  lang: 'en-US',
  cleanUrls: true,

  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'on-device',
        llmText: {
          enabled: true,
          formats: ['txt', 'jsonl', 'markdown'],
          includeMetadata: true
        }
      })
    ]
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API Reference', link: '/api/' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/guide/' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'How It Works', link: '/guide/how-it-works' },
          { text: 'FAQ & Troubleshooting', link: '/guide/faq' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Core API & SDK', link: '/api/' }
        ]
      },
      {
        text: 'Community',
        items: [
          { text: 'Style & Customization', link: '/guide/community' },
          { text: 'Contributing Guide', link: '/community/contributing' },
          { text: 'Code of Conduct', link: '/community/code-of-conduct' },
          { text: 'Support & PayPal', link: '/community/support' },
          { text: 'Tool Attributions', link: '/community/attributions' }
        ]
      },
      {
        text: 'Legal & Security',
        items: [
          { text: 'Privacy Policy', link: '/legal/privacy-policy' },
          { text: 'Security Policy', link: '/legal/security' },
          { text: 'MIT License', link: '/legal/license' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ]
  }
});
