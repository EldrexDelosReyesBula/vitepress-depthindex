// src/client/icons.ts

export const ICONS = {
  // Panel controls
  close: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l16 16M17 1L1 17"/></svg>`,
  
  expand: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h12v12H3z"/></svg>`,
  
  collapse: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h8v8H3z"/><path d="M7 7l4-4M7 11V7h4"/></svg>`,
  
  // Actions
  send: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 2l16 8-16 8 4-8-4-8z"/></svg>`,
  
  copy: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v8a1 1 0 001 1h2"/></svg>`,
  
  refresh: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8a7 7 0 0114 0 7 7 0 01-14 0z"/><path d="M1 3v5h5"/></svg>`,
  
  // States
  search: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>`,
  
  thinking: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" class="di-spin"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg>`,
  
  cloud: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12a3 3 0 010-6 4 4 0 017.5-1 3 3 0 010 6H4z"/></svg>`,
  
  device: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="9" rx="1"/><path d="M6 14h4"/><path d="M8 11v3"/></svg>`,
  
  // Content types
  code: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4l-4 4 4 4M11 4l4 4-4 4"/></svg>`,
  
  diagram: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M7 4h2M4 7v2"/></svg>`,
  
  math: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><text x="2" y="13" font-size="12" font-weight="bold">∑</text></svg>`,
  
  image: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="14" height="10" rx="1"/><circle cx="5" cy="7" r="1.5"/><path d="M1 11l4-3 3 2 3-4 4 5"/></svg>`,
  
  video: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5,3 13,8 5,13"/><rect x="1" y="3" width="3" height="10" rx="0.5"/></svg>`,
  
  // Feedback
  thumbsUp: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h2v7H4z"/><path d="M6 7l1-4a2 2 0 012 2v2h3a1 1 0 011 1l-1 5a1 1 0 01-1 1H6"/></svg>`,
  
  thumbsDown: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9h2V2H4z"/><path d="M6 9l1 4a2 2 0 012-2V9h3a1 1 0 001-1L12 3a1 1 0 00-1-1H6"/></svg>`,
  
  // Settings
  settings: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.5 2.5l1.5 1.5M12 12l1.5 1.5M2.5 13.5l1.5-1.5M12 4l1.5-1.5"/></svg>`,
  
  history: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/><path d="M2 2v3h3"/></svg>`,
  
  newChat: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v12M2 8h12"/></svg>`,
  
  edit: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2 2-10 10H2v-2L12 2z"/></svg>`,
  delete: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5 4V2.5a1 1 0 011-1h4a1 1 0 011 1V4m-8 0v10a1 1 0 001 1h8a1 1 0 001-1V4"/></svg>`,
};
