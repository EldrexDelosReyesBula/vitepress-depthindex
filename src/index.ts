import { Plugin } from 'vite';
import { buildIndex } from './build/pipeline.js';
import { generateLLMText } from './build/llm-txt.js';
import { serializeAndCompressIndex } from './build/indexer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DepthIndexOptions } from './types/index.js';
import { ComplianceEnforcer } from './sdk/compliance.js';

// Resolve the absolute path to FloatingButton.vue from this plugin's own location.
// This works whether the plugin is used as a local file or installed from npm.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// In the built ESM dist, __dirname is dist/. FloatingButton.vue is at src/components/ (dev)
// or needs to be resolved relative to the installed package root.
const FLOATING_BUTTON_VUE_PATH = path.resolve(__dirname, '..', 'src', 'components', 'FloatingButton.vue');
const FLOATING_BUTTON_VIRTUAL_ID = '\0vitepress-plugin-depthindex/components/FloatingButton.vue';
const TOKENS_CSS_VIRTUAL_ID = '\0vitepress-plugin-depthindex/dist/styles/tokens.css';
const SEARCH_BAR_CSS_VIRTUAL_ID = '\0vitepress-plugin-depthindex/dist/styles/search-bar.css';

const DEFAULT_OPTIONS: DepthIndexOptions = {
  searchMode: 'on-device',
  placement: {
    mode: 'all',
  },
  searchBar: {
    enabled: true,
    position: 'top',
    maxAnswerLength: 500,
    showExpandButton: true,
    placeholder: 'Ask AI or search docs...',
    shortcut: '⌘K',
  },
  panel: {
    enabled: true,
    position: 'right',
    defaultSize: 'normal',
    showHistory: true,
    showSettings: true,
  },
  floatingButton: {
    enabled: true,
    position: 'bottom-right',
    icon: 'fa-solid fa-comment-dots',
    pulse: true,
  },
  indexConfig: {
    chunkSize: 500,
    overlapSize: 50,
    excludePages: ['/changelog'],
    includeCodeBlocks: true,
    includeMermaid: true,
  },
  ui: {
    theme: 'auto',
    position: 'bottom-right',
    showFloatingButton: true,
    enableFullscreen: true,
    enableModal: true,
    showSettingsButton: true,
    defaultSize: 'normal',
    triggerIcon: 'fa-solid fa-comment-dots',
    title: '',
    customClass: '',
  },
  features: {
    allowUserCloudConfig: true,
    showAttribution: true,
    allowEdit: true,
    allowFeedback: true,
  },
  personalization: {
    enabled: false,  // OFF by default — opt-in, recommended for hybrid/cloud only
    storage: 'localStorage',
    maxHistory: 20,
  },
  offline: {
    enabled: true,
    cacheStrategy: 'network-first',
  },
  llmText: {
    enabled: true,
    formats: ['txt', 'jsonl'],
    includeMetadata: true,
  },
  extensions: [],
};

export default function DepthIndexPlugin(
  options: Partial<DepthIndexOptions> = {}
): Plugin {
  // Deep merge default options with user options
  const configOptions: DepthIndexOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    placement: {
      mode: options.placement?.mode || (options.ui?.showFloatingButton === false ? 'search-bar' : 'all'),
      searchBarSelector: options.placement?.searchBarSelector,
    },
    searchBar: {
      enabled: options.searchBar?.enabled ?? (options.ui?.enableModal ?? true),
      position: options.searchBar?.position || 'top',
      maxAnswerLength: options.searchBar?.maxAnswerLength || 500,
      showExpandButton: options.searchBar?.showExpandButton ?? true,
      placeholder: options.searchBar?.placeholder || 'Ask AI or search docs...',
      logo: options.searchBar?.logo,
      shortcut: options.searchBar?.shortcut || '⌘K',
    },
    panel: {
      enabled: options.panel?.enabled ?? true,
      position: options.panel?.position || (options.ui?.position === 'bottom-left' ? 'left' : 'right'),
      defaultSize: options.panel?.defaultSize || options.ui?.defaultSize || 'normal',
      showHistory: options.panel?.showHistory ?? true,
      logo: options.panel?.logo,
      title: options.panel?.title || options.ui?.title || '',
      subtitle: options.panel?.subtitle || '',
      showSettings: options.panel?.showSettings ?? options.ui?.showSettingsButton ?? true,
    },
    floatingButton: {
      enabled: options.floatingButton?.enabled ?? options.ui?.showFloatingButton ?? true,
      position: options.floatingButton?.position || options.ui?.position || 'bottom-right',
      icon: options.floatingButton?.icon || options.ui?.triggerIcon || 'fa-solid fa-comment-dots',
      pulse: options.floatingButton?.pulse ?? true,
      label: options.floatingButton?.label,
    },
    indexConfig: {
      ...DEFAULT_OPTIONS.indexConfig,
      ...options.indexConfig,
    },
    ui: {
      ...DEFAULT_OPTIONS.ui,
      ...options.ui,
    },
    features: {
      ...DEFAULT_OPTIONS.features,
      ...options.features,
    },
    personalization: {
      ...DEFAULT_OPTIONS.personalization,
      ...options.personalization,
      maxHistory: options.personalization?.maxHistory ?? DEFAULT_OPTIONS.personalization.maxHistory,
    },
    offline: {
      ...DEFAULT_OPTIONS.offline,
      ...options.offline,
    },
    llmText: {
      ...DEFAULT_OPTIONS.llmText,
      ...options.llmText,
    },
    extensions: options.extensions || [],
  };

  const apiKeyEnv = (typeof process !== 'undefined' && process.env?.VITE_DEPTHINDEX_CLOUD_API_KEY) || 
                    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEPTHINDEX_CLOUD_API_KEY);
  if (apiKeyEnv) {
    if (configOptions.features) {
      configOptions.features.allowUserCloudConfig = false;
    }
    if (configOptions.ui) {
      configOptions.ui.showSettingsButton = false;
    }
  }

  // Split extensions into static (serializeable, like language packs) and client-only (which run in browser)
  const clientExtensions: any[] = [];
  
  if (configOptions.extensions && Array.isArray(configOptions.extensions)) {
    for (const ext of configOptions.extensions) {
      if (ext.manifest) {
        // Run compliance checks at build time
        const mockRegPlugin = {
          manifest: ext.manifest,
          hooks: ext.hooks || {},
          context: {} as any,
          status: 'registered' as const,
          registeredAt: Date.now()
        };
        const report = ComplianceEnforcer.validateAllPlugins([mockRegPlugin]);
        if (!report.passed) {
          report.violations.forEach(v => {
            console.error(`[DepthIndex Build-Time Compliance Error] ${v.message}`);
          });
        }
        
        if (report.passed && report.disclosures.length > 0) {
          const notice = ComplianceEnforcer.generateDisclosureNotice(report);
          console.log(`[DepthIndex Build-Time Compliance Notice]\n${notice}`);
        }
      }
      
      // If it is a language pack (static), serialize it
      if (ext.type === 'language' && ext.pack) {
        clientExtensions.push({
          type: 'language',
          pack: ext.pack
        });
      }
    }
  }

  // Create serializable config options
  const serializableConfig = {
    ...configOptions,
    extensions: clientExtensions
  };

  let srcDir = '';
  let outDir = '';
  let pages: string[] = [];
  let isBuild = false;
  let seoOutput: any = null;

  const virtualModuleId = 'virtual:depthindex-client';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vitepress-depthindex',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/depthindex-search-worker.js') {
          const workerPath = path.resolve(__dirname, './client/search-worker.js');
          if (fs.existsSync(workerPath)) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.end(fs.readFileSync(workerPath, 'utf-8'));
            return;
          }
        }
        if (req.url === '/depthindex-search-bar.css') {
          const cssPath = path.resolve(__dirname, './styles/search-bar.css');
          if (fs.existsSync(cssPath)) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.end(fs.readFileSync(cssPath, 'utf-8'));
            return;
          }
        }
        if (req.url === '/depthindex-tokens.css') {
          const cssPath = path.resolve(__dirname, './styles/tokens.css');
          if (fs.existsSync(cssPath)) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.end(fs.readFileSync(cssPath, 'utf-8'));
            return;
          }
        }
        if (req.url?.endsWith('.worker.js') || req.url?.includes('search-worker') || req.url?.includes('depthindex-search-worker')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        }
        next();
      });
    },


    config() {
      return {
        define: {
          __DEPTHINDEX_OPTIONS__: JSON.stringify(serializableConfig)
        }
      };
    },

    configResolved(config: any) {
      isBuild = config.command === 'build';
      
      // VitePress exposes its config on ResolvedConfig
      const vpConfig = (config as any).vitepress;
      if (vpConfig) {
        srcDir = vpConfig.srcDir || config.root;
        outDir = vpConfig.outDir || path.resolve(config.root, '.vitepress/dist');
        
        // Retrieve all pages relative to srcDir
        if (vpConfig.pages) {
          pages = vpConfig.pages;
        }

        // Intercept VitePress transformHtml hook
        const originalTransformHtml = vpConfig.transformHtml;
        vpConfig.transformHtml = async (html: string, id: string, ctx: any) => {
          let transformed = html;
          if (originalTransformHtml) {
            transformed = await originalTransformHtml(html, id, ctx);
          }
          
          if (configOptions.seo && seoOutput) {
            const relativePath = '/' + path.relative(outDir, id).replace(/\\/g, '/');
            let urlKey = relativePath;
            if (urlKey.endsWith('/index.html')) {
              urlKey = urlKey.substring(0, urlKey.length - 10);
            }
            if (urlKey === '/index.html') {
              urlKey = '/';
            }
            
            const metaTags = seoOutput.pageMetaTags.get(urlKey);
            if (metaTags) {
              const { MetaTagInjector } = await import('./build/meta-injector.js');
              const { FreeDomainOptimizer } = await import('./build/free-domain-seo.js');
              
              const metaInjector = new MetaTagInjector();
              transformed = metaInjector.injectMetaTags(transformed, metaTags);
              
              // Free domain boost
              let siteUrl = configOptions.seo.siteUrl;
              if (!siteUrl) {
                if (process.env.VERCEL_URL) {
                  siteUrl = `https://${process.env.VERCEL_URL}`;
                } else if (process.env.NETLIFY_URL) {
                  siteUrl = process.env.NETLIFY_URL;
                } else {
                  siteUrl = 'https://depthindex.vercel.app';
                }
              }
              if (FreeDomainOptimizer.isFreeDomain(siteUrl)) {
                const boost = FreeDomainOptimizer.generateFreeDomainBoost({
                  siteUrl,
                  siteName: configOptions.seo.siteName,
                  description: configOptions.seo.siteDescription
                });
                if (transformed.includes('</head>')) {
                  transformed = transformed.replace('</head>', `${boost.additionalMeta}\n${boost.socialSignals}\n</head>`);
                }
                if (transformed.includes('</body>')) {
                  transformed = transformed.replace('</body>', `${boost.submissionGuide}\n</body>`);
                }
              }
            }

            if (urlKey === '/' && seoOutput.submissionHints) {
              transformed = transformed.replace('</body>', `${seoOutput.submissionHints}\n</body>`);
            }
          }
          
          return transformed;
        };
      } else {
        // Fallback for non-VitePress environment
        srcDir = config.root;
        outDir = path.resolve(config.root, 'dist');
      }

      // If pages is empty, crawl srcDir for markdown files recursively
      if (pages.length === 0) {
        pages = crawlMarkdownFiles(srcDir);
      }
    },

    resolveId(id: string) {
      if (id === '/@depthindex/client.js' || id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      // Intercept the FloatingButton.vue import from the virtual client module.
      // The package.json exports map doesn't expose this sub-path, so we resolve
      // it manually to the actual .vue file location.
      if (id === 'vitepress-plugin-depthindex/components/FloatingButton.vue') {
        return FLOATING_BUTTON_VIRTUAL_ID;
      }
      if (id === 'vitepress-plugin-depthindex/dist/styles/tokens.css') {
        return TOKENS_CSS_VIRTUAL_ID;
      }
      if (id === 'vitepress-plugin-depthindex/dist/styles/search-bar.css') {
        return SEARCH_BAR_CSS_VIRTUAL_ID;
      }
    },

    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        // Return client-side initializer code
        return `
          import { createApp, h } from 'vue';
          import FloatingButton from 'vitepress-plugin-depthindex/components/FloatingButton.vue';
          import 'vitepress-plugin-depthindex/dist/styles/tokens.css';
          import 'vitepress-plugin-depthindex/dist/styles/search-bar.css';

          if (typeof window !== 'undefined') {
            const init = () => {
              if (document.getElementById('depthindex-container')) return;
              const container = document.createElement('div');
              container.id = 'depthindex-container';
              document.body.appendChild(container);

              const app = createApp({
                render() {
                  return h(FloatingButton, {
                    options: __DEPTHINDEX_OPTIONS__
                  });
                }
              });
              app.mount('#depthindex-container');
            };

            if (document.readyState === 'loading') {
              window.addEventListener('DOMContentLoaded', init);
            } else {
              init();
            }
          }
        `;
      }
      // Serve FloatingButton.vue source from the plugin's own location
      if (id === FLOATING_BUTTON_VIRTUAL_ID) {
        try {
          return fs.readFileSync(FLOATING_BUTTON_VUE_PATH, 'utf-8');
        } catch {
          // Fallback: look relative to the installed npm package (dist/../src/components/)
          const fallback = path.resolve(__dirname, 'components', 'FloatingButton.vue');
          if (fs.existsSync(fallback)) {
            return fs.readFileSync(fallback, 'utf-8');
          }
          console.warn('[depthindex] FloatingButton.vue not found at:', FLOATING_BUTTON_VUE_PATH);
        }
      }
      // Serve CSS stylesheets
      if (id === TOKENS_CSS_VIRTUAL_ID) {
        try {
          const devPath = path.resolve(__dirname, '..', 'src', 'styles', 'tokens.css');
          if (fs.existsSync(devPath)) return fs.readFileSync(devPath, 'utf-8');
          const npmPath = path.resolve(__dirname, 'styles', 'tokens.css');
          return fs.readFileSync(npmPath, 'utf-8');
        } catch {
          console.warn('[depthindex] tokens.css not found');
        }
      }
      if (id === SEARCH_BAR_CSS_VIRTUAL_ID) {
        try {
          const devPath = path.resolve(__dirname, '..', 'src', 'styles', 'search-bar.css');
          if (fs.existsSync(devPath)) return fs.readFileSync(devPath, 'utf-8');
          const npmPath = path.resolve(__dirname, 'styles', 'search-bar.css');
          return fs.readFileSync(npmPath, 'utf-8');
        } catch {
          console.warn('[depthindex] search-bar.css not found');
        }
      }
    },

    transform(code: string, id: string) {
      const normalizedId = id.replace(/\\/g, '/');
      if (normalizedId.includes('vitepress/dist/client/app/index.js') || normalizedId.includes('vitepress/dist/client/app/index.ts')) {
        return {
          code: code + `\nimport 'virtual:depthindex-client';\n`,
          map: null
        };
      }
    },

    transformIndexHtml(html: string) {
      let processed = html;
      
      // Inject KaTeX CSS
      if (!processed.includes('katex@0.16.9/dist/katex.min.css')) {
        const katexLink = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">`;
        if (processed.includes('</head>')) {
          processed = processed.replace('</head>', `${katexLink}\n</head>`);
        } else {
          processed = `<head>${katexLink}</head>` + processed;
        }
      }
      
      // Inject FontAwesome 6 CSS
      if (!processed.includes('font-awesome/6.5.1/css/all.min.css')) {
        const faLink = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;
        if (processed.includes('</head>')) {
          processed = processed.replace('</head>', `${faLink}\n</head>`);
        } else {
          processed = `<head>${faLink}</head>` + processed;
        }
      }
      
      return processed;
    },

    async generateBundle() {
      if (!isBuild) return;

      try {
        if (configOptions.searchMode === 'cloud') {
          console.log('[depthindex] Cloud-only mode: skipping index, generating llms.txt');
          const { extractAllPages } = await import('./build/extractor.js');
          const extracted = await extractAllPages(pages, srcDir);
          
          const { CloudOnlyStrategy } = await import('./build/cloud-only-strategy.js');
          const strategy = new CloudOnlyStrategy();
          const buildOutput = await strategy.buildForCloud(extracted, configOptions);

          this.emitFile({
            type: 'asset',
            fileName: 'llms.txt',
            source: buildOutput['llms.txt'],
          });

          this.emitFile({
            type: 'asset',
            fileName: 'llms.jsonl',
            source: buildOutput['llms.jsonl'],
          });

          this.emitFile({
            type: 'asset',
            fileName: 'page-manifest.json',
            source: buildOutput['page-manifest.json'],
          });
        } else {
          console.log('[depthindex] Generating documentation index...');
          const indexData = await buildIndex(pages, configOptions, srcDir);
          const compressed = serializeAndCompressIndex(indexData);

          this.emitFile({
            type: 'asset',
            fileName: 'assets/depth-index.json',
            source: compressed,
          });
          console.log('[depthindex] Index written successfully to assets/depth-index.json');
        }

        if (configOptions.offline.enabled) {
          const swContent = `
            const CACHE_NAME = 'depthindex-cache-v1';
            const ASSETS_TO_CACHE = [
              '/',
              ${configOptions.searchMode === 'cloud' ? "'/page-manifest.json'" : "'/assets/depth-index.json'"}
            ];

            self.addEventListener('install', event => {
              event.waitUntil(
                caches.open(CACHE_NAME).then(cache => {
                  return cache.addAll(ASSETS_TO_CACHE);
                })
              );
              self.skipWaiting();
            });

            self.addEventListener('activate', event => {
              event.waitUntil(
                caches.keys().then(cacheNames => {
                  return Promise.all(
                    cacheNames.map(cache => {
                      if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                      }
                    })
                  );
                })
              );
              self.clients.claim();
            });

            self.addEventListener('fetch', event => {
              if (event.request.method !== 'GET') return;
              if (!event.request.url.startsWith('http')) return;

              const isHtml = event.request.headers.get('accept')?.includes('text/html') ||
                             event.request.url.endsWith('/') ||
                             event.request.url.endsWith('.html');

              if (isHtml) {
                // Network-First for HTML documents to prevent stale chunk hash mismatches
                event.respondWith(
                  fetch(event.request)
                    .then(response => {
                      if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                      }
                      return response;
                    })
                    .catch(() => caches.match(event.request).then(cached => {
                      if (cached) return cached;
                      throw new Error('Offline and not cached');
                    }))
                );
                return;
              }

              // Cache-First for static assets (e.g. search indexes, fonts, stylesheets)
              event.respondWith(
                caches.match(event.request).then(cachedResponse => {
                  if (cachedResponse) {
                    fetch(event.request).then(networkResponse => {
                      if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                      }
                    }).catch(() => {});
                    return cachedResponse;
                  }

                  return fetch(event.request).then(response => {
                    if (!response || response.status !== 200) {
                      return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                      cache.put(event.request, responseToCache);
                    });
                    return response;
                  });
                })
              );
            });
          `;
          this.emitFile({
            type: 'asset',
            fileName: 'depthindex-sw.js',
            source: swContent,
          });
          console.log('[depthindex] Service worker emitted successfully.');

          // Emit search-worker.js as depthindex-search-worker.js
          const workerPath = path.resolve(__dirname, './client/search-worker.js');
          if (fs.existsSync(workerPath)) {
            const workerSource = fs.readFileSync(workerPath, 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'depthindex-search-worker.js',
              source: workerSource,
            });
            console.log('[depthindex] Search worker emitted successfully.');
          } else {
            console.warn('[depthindex] search-worker.js not found at:', workerPath);
          }

          // Emit search-bar.css as depthindex-search-bar.css
          const cssPath = path.resolve(__dirname, './styles/search-bar.css');
          if (fs.existsSync(cssPath)) {
            const cssSource = fs.readFileSync(cssPath, 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'depthindex-search-bar.css',
              source: cssSource,
            });
            console.log('[depthindex] Search bar stylesheet emitted successfully.');
          } else {
            console.warn('[depthindex] search-bar.css not found at:', cssPath);
          }

          // Emit tokens.css as depthindex-tokens.css
          const tokensPath = path.resolve(__dirname, './styles/tokens.css');
          if (fs.existsSync(tokensPath)) {
            const tokensSource = fs.readFileSync(tokensPath, 'utf-8');
            this.emitFile({
              type: 'asset',
              fileName: 'depthindex-tokens.css',
              source: tokensSource,
            });
            console.log('[depthindex] Tokens stylesheet emitted successfully.');
          } else {
            console.warn('[depthindex] tokens.css not found at:', tokensPath);
          }
        }

        // SEO Generation
        if (configOptions.seo) {
          console.log('[depthindex] Generating SEO artifacts...');
          const { SEOOptimizer } = await import('./build/seo-optimizer.js');
          
          let siteUrl = configOptions.seo.siteUrl;
          if (!siteUrl) {
            if (process.env.VERCEL_URL) {
              siteUrl = `https://${process.env.VERCEL_URL}`;
            } else if (process.env.NETLIFY_URL) {
              siteUrl = process.env.NETLIFY_URL;
            } else {
              siteUrl = 'https://depthindex.vercel.app';
            }
          }

          const seoOptimizer = new SEOOptimizer({
            ...configOptions.seo,
            siteUrl,
          });

          const { extractAllPages } = await import('./build/extractor.js');
          const extracted = await extractAllPages(pages, srcDir);
          
          seoOutput = await seoOptimizer.optimize(extracted, outDir);

          // Emit SEO files
          for (const [filename, content] of Object.entries(seoOutput.files)) {
            this.emitFile({
              type: 'asset',
              fileName: filename,
              source: content as string,
            });
          }

          // Emit submission hints
          this.emitFile({
            type: 'asset',
            fileName: 'assets/seo-submission-hints.html',
            source: seoOutput.submissionHints as string,
          });

          console.log('[depthindex] SEO optimization complete!');
          console.log(`  • sitemap.xml — ${extracted.length} URLs indexed`);
          console.log(`  • robots.txt — AI crawlers: ${configOptions.seo.aiCrawlerPolicy || 'allow'}`);
          console.log(`  • llms.txt — Full text for AI training`);
          console.log(`  • .well-known/ai.json — AI discoverability endpoint`);
        }
      } catch (err) {
        console.error('[depthindex] Failed to generate search index:', err);
      }
    },

    async closeBundle() {
      if (!isBuild) return;

      try {
        // 1. Inject KaTeX and FontAwesome CSS links into all statically built html files
        console.log('[depthindex] Injecting CDN styles into HTML pages...');
        injectCDNLinksIntoHtmlFiles(outDir);

        // 2. Extract pages content
        const { extractAllPages } = await import('./build/extractor.js');
        const extracted = await extractAllPages(pages, srcDir);

        // 3. Generate LLM files
        if (configOptions.llmText.enabled && configOptions.searchMode !== 'cloud') {
          console.log('[depthindex] Generating LLMs.txt files...');
          await generateLLMText(extracted, configOptions, outDir);
          console.log('[depthindex] LLMs.txt files generated in outDir');
        }
      } catch (err) {
        console.error('[depthindex] Failed during closeBundle processing:', err);
      }
    },
  };
}

function injectCDNLinksIntoHtmlFiles(dir: string): void {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach((file: string) => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      injectCDNLinksIntoHtmlFiles(fullPath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let modified = false;
      
      if (!content.includes('katex@0.16.9/dist/katex.min.css')) {
        const katexLink = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">`;
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${katexLink}\n</head>`);
        } else {
          content = katexLink + content;
        }
        modified = true;
      }
      
      if (!content.includes('font-awesome/6.5.1/css/all.min.css')) {
        const faLink = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${faLink}\n</head>`);
        } else {
          content = faLink + content;
        }
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf-8');
      }
    }
  });
}

function injectSEOMetaIntoHtmlFiles(
  dir: string,
  pageMetaTags: Map<string, any>,
  boost: { additionalMeta: string; socialSignals: string; submissionGuide: string } | null,
  metaInjector: any,
  baseDir: string = dir
): void {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  
  list.forEach((file: string) => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      injectSEOMetaIntoHtmlFiles(fullPath, pageMetaTags, boost, metaInjector, baseDir);
    } else if (file.endsWith('.html')) {
      let relativePath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      
      let metaTags = pageMetaTags.get(relativePath);
      
      if (!metaTags && relativePath === '/index.html') {
        metaTags = pageMetaTags.get('/');
      }
      
      if (!metaTags) {
        let cleanKey = relativePath;
        if (cleanKey.endsWith('/index.html')) {
          cleanKey = cleanKey.substring(0, cleanKey.length - 10);
        }
        metaTags = pageMetaTags.get(cleanKey);
      }
      
      if (metaTags) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        
        // Inject SEO Meta tags
        content = metaInjector.injectMetaTags(content, metaTags);
        
        // Inject Free Domain Boost if applicable
        if (boost) {
          if (content.includes('</head>')) {
            content = content.replace('</head>', `${boost.additionalMeta}\n${boost.socialSignals}\n</head>`);
          }
          if (content.includes('</body>')) {
            content = content.replace('</body>', `${boost.submissionGuide}\n</body>`);
          }
        }
        
        fs.writeFileSync(fullPath, content, 'utf-8');
      }
    }
  });
}

function crawlMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  list.forEach((file: string) => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
        results = results.concat(crawlMarkdownFiles(fullPath, baseDir));
      }
    } else if (file.endsWith('.md')) {
      results.push(path.relative(baseDir, fullPath));
    }
  });
  return results;
}

export { PrivacyFirewall } from './privacy/firewall.js';
export { TranslationEngine } from './i18n/engine.js';
