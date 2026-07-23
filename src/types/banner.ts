// src/types/banner.ts

export type BannerType = 'banner' | 'modal' | 'bottom-sheet' | 'fullscreen' | 'inline' | 'toast';
export type BannerPosition = 'top' | 'bottom' | 'center';

export interface BannerConfig {
  /** Unique banner ID */
  id: string;
  
  /** Banner type */
  type: BannerType;
  
  /** Banner position */
  position?: BannerPosition;
  
  /** Title */
  title?: string;
  
  /** Content (supports markdown) */
  content: string;
  
  /** Icon (FontAwesome or custom SVG) */
  icon?: string;
  
  /** Custom logo/illustration */
  image?: string;
  
  /** Primary action button */
  primaryAction?: {
    text: string;
    onClick?: () => void;
    url?: string;
    icon?: string;
    style?: 'primary' | 'secondary' | 'danger' | 'success';
  };
  
  /** Secondary action button */
  secondaryAction?: {
    text: string;
    onClick?: () => void;
    url?: string;
  };
  
  /** Dismiss button */
  dismissible?: boolean;
  
  /** Show once per session */
  showOnce?: boolean;
  
  /** Show once ever (uses localStorage) */
  showOnceEver?: boolean;
  
  /** Auto-dismiss after milliseconds */
  autoDismiss?: number;
  
  /** Trigger condition */
  trigger?: {
    /** Show after X searches */
    afterSearches?: number;
    /** Show after X page views */
    afterPageViews?: number;
    /** Show after X seconds on site */
    afterSeconds?: number;
    /** Show on specific pages */
    onPages?: string[];
    /** Show when user is about to exit */
    onExitIntent?: boolean;
  };
  
  /** Custom CSS class */
  customClass?: string;
  
  /** Custom styles */
  customStyles?: Record<string, string>;
  
  /** Animation */
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  
  /** Overlay (for modal/fullscreen) */
  overlay?: boolean;
  
  /** Close on overlay click */
  closeOnOverlay?: boolean;
  
  /** Close on Escape key */
  closeOnEscape?: boolean;
}
