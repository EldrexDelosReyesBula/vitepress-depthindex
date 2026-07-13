import type { PluginManifest, DepthIndexError } from '../../sdk/index.js';

export interface CloudExtensionManifest extends PluginManifest {
  dpa: DataProcessingAgreement;
}

export interface DataProcessingAgreement {
  processorName: string;
  processingLocation: string;
  dataCategories: string[];
  purposes: string[];
  retention: string;
  subProcessors?: Array<{ name: string; location: string; purpose: string }>;
}

/**
 * Error Reporting Extension Contract
 */
export interface ErrorReportingExtension {
  reportError(error: DepthIndexError): Promise<void>;
  getStats(): Promise<ErrorStats>;
}

export interface ErrorStats {
  totalErrors: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  period: { start: Date; end: Date };
}

/**
 * Analytics Extension Contract
 * 
 * STRICT REQUIREMENTS:
 * - Must disclose all data collection
 * - Must provide opt-out mechanism
 * - Must honor Do Not Track (DNT) headers / settings
 * - Must be compliant with GDPR, CCPA, and Ph Data Privacy Act (RA 10173)
 */
export interface AnalyticsExtension {
  trackEvent(event: AnalyticsEvent): Promise<void>;
  getConfig(): AnalyticsConfig;
}

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, string>;
  userConsented: boolean;
}

export interface AnalyticsConfig {
  trackedEvents: string[];
  optOutUrl: string;
  privacyPolicyUrl: string;
  retentionPeriod: string;
  anonymized: boolean;
}

/**
 * Custom Cloud AI Extension Contract
 */
export interface CloudAIExtension {
  query(query: string, context: string): Promise<string>;
  getModelInfo(): Promise<ModelInfo>;
}

export interface ModelInfo {
  name: string;
  provider: string;
  capabilities: string[];
  contextWindow: number;
  pricing?: string;
}
