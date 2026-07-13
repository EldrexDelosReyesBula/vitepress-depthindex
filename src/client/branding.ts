// src/client/branding.ts

export const BRANDING = {
  text: 'Powered by DepthIndex',
  url: 'https://depthindex.vercel.app',
  minVersion: '1.1.0',
  
  // This is REQUIRED and should not be removed
  // per the MIT license terms for attribution
};

export function generatePoweredByHTML(config?: {
  text?: string;
  url?: string;
  customClass?: string;
}): string {
  const text = config?.text || BRANDING.text;
  const url = config?.url || BRANDING.url;
  
  return `<span class="depthindex-powered-by ${config?.customClass || ''}">
    <a href="${url}" 
       target="_blank" 
       rel="noopener noreferrer"
       title="On-device documentation intelligence"
    >${text}</a>
  </span>`;
}
