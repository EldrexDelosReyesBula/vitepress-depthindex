import { Plugin } from 'vite';
import { buildIndex } from './build/pipeline.js';
import { generateLLMText } from './build/llm-txt.js';
import { serializeAndCompressIndex } from './build/indexer.js';
import fs from 'fs';
import path from 'path';
import { DepthIndexOptions } from './types/index.js';

const DEFAULT_OPTIONS: DepthIndexOptions = {
  searchMode: 'on-device',
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
  },
  personalization: {
    enabled: true,
    storage: 'localStorage',
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
};

export default function DepthIndexPlugin(
  options: Partial<DepthIndexOptions> = {}
): Plugin {
  // Deep merge default options with user options
  const configOptions: DepthIndexOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    indexConfig: {
      ...DEFAULT_OPTIONS.indexConfig,
      ...options.indexConfig,
    },
    ui: {
      ...DEFAULT_OPTIONS.ui,
      ...options.ui,
    },
    personalization: {
      ...DEFAULT_OPTIONS.personalization,
      ...options.personalization,
    },
    offline: {
      ...DEFAULT_OPTIONS.offline,
      ...options.offline,
    },
    llmText: {
      ...DEFAULT_OPTIONS.llmText,
      ...options.llmText,
    },
  };

  let srcDir = '';
  let outDir = '';
  let pages: string[] = [];
  let isBuild = false;

  const virtualModuleId = 'virtual:depthindex-client';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vitepress-depthindex',

    config() {
      return {
        define: {
          __DEPTHINDEX_OPTIONS__: JSON.stringify(configOptions)
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
    },

    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        // Return client-side initializer code
        return `
          import { createApp, h } from 'vue';
          import FloatingButton from 'vitepress-plugin-depthindex/components/FloatingButton.vue';

          if (typeof window !== 'undefined') {
            window.addEventListener('DOMContentLoaded', () => {
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
            });
          }
        `;
      }
    },

    transformIndexHtml(html: string) {
      // Injects client script and style tags into the HTML output
      // Only do this in build mode or let it resolve in dev server
      const scriptTag = `<script type="module" src="/@depthindex/client.js"></script>`;
      if (html.includes('</body>')) {
        return html.replace('</body>', `${scriptTag}\n</body>`);
      }
      return html + scriptTag;
    },

    async generateBundle() {
      if (!isBuild) return;

      try {
        console.log('[depthindex] Generating documentation index...');
        const indexData = await buildIndex(pages, configOptions, srcDir);
        const compressed = serializeAndCompressIndex(indexData);

        this.emitFile({
          type: 'asset',
          fileName: 'assets/depth-index.json.gz',
          source: compressed,
        });
        console.log('[depthindex] Index written successfully to assets/depth-index.json.gz');

        if (configOptions.offline.enabled) {
          const swContent = `
            const CACHE_NAME = 'depthindex-cache-v1';
            const ASSETS_TO_CACHE = [
              '/',
              '/assets/depth-index.json.gz'
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
                    .catch(() => caches.match(event.request))
                );
                return;
              }

              // Cache-First for static assets (e.g. search indexes, fonts, stylesheets)
              event.respondWith(
                caches.match(event.request).then(cachedResponse => {
                  if (cachedResponse) {
                    fetch(event.request).then(networkResponse => {
                      if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
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
        }
      } catch (err) {
        console.error('[depthindex] Failed to generate search index:', err);
      }
    },

    async closeBundle() {
      if (!isBuild) return;

      try {
        // 1. Inject client script into all statically built html files
        console.log('[depthindex] Injecting client runtime into HTML pages...');
        const scriptTag = `<script type="module" src="/@depthindex/client.js"></script>`;
        injectScriptIntoHtmlFiles(outDir, scriptTag);

        // 2. Generate LLM files
        if (configOptions.llmText.enabled) {
          console.log('[depthindex] Generating LLMs.txt files...');
          const { extractAllPages } = await import('./build/extractor.js');
          const extracted = await extractAllPages(pages, srcDir);
          await generateLLMText(extracted, configOptions, outDir);
          console.log('[depthindex] LLMs.txt files generated in outDir');
        }
      } catch (err) {
        console.error('[depthindex] Failed during closeBundle processing:', err);
      }
    },
  };
}

function injectScriptIntoHtmlFiles(dir: string, scriptTag: string): void {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach((file: string) => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      injectScriptIntoHtmlFiles(fullPath, scriptTag);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (!content.includes('/@depthindex/client.js')) {
        if (content.includes('</body>')) {
          content = content.replace('</body>', `${scriptTag}\n</body>`);
        } else {
          content = content + scriptTag;
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
