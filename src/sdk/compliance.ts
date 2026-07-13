import { PluginPermission } from './index.js';
import type { RegisteredPlugin } from './index.js';

export interface ComplianceViolation {
  pluginId: string;
  type: string;
  message: string;
}

export interface ComplianceWarning {
  pluginId: string;
  type: string;
  message: string;
}

export interface Disclosure {
  pluginId: string;
  pluginName: string;
  type: 'external_communication' | 'data_collection';
  endpoints?: string[];
  privacyPolicy?: string;
  dataCollected?: string[];
  retention?: string;
}

export interface ComplianceReport {
  passed: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  disclosures: Disclosure[];
}

export class ComplianceEnforcer {
  /**
   * Validate that all active plugins meet compliance requirements
   */
  static validateAllPlugins(plugins: RegisteredPlugin[]): ComplianceReport {
    const report: ComplianceReport = {
      passed: true,
      violations: [],
      warnings: [],
      disclosures: [],
    };
    
    for (const plugin of plugins) {
      const manifest = plugin.manifest;
      
      // Check data disclosure presence
      if (!manifest.dataDisclosure) {
        report.violations.push({
          pluginId: manifest.id,
          type: 'missing_disclosure',
          message: `Plugin "${manifest.name}" missing data disclosure`,
        });
        report.passed = false;
        continue;
      }
      
      // Check compliance statement presence
      if (!manifest.compliance) {
        report.violations.push({
          pluginId: manifest.id,
          type: 'missing_compliance_statement',
          message: `Plugin "${manifest.name}" missing compliance statement`,
        });
        report.passed = false;
        continue;
      }
      
      // Check external communication disclosure
      if (manifest.permissions && manifest.permissions.includes(PluginPermission.EXTERNAL_COMMUNICATION)) {
        if (!manifest.dataDisclosure.externalEndpoints || manifest.dataDisclosure.externalEndpoints.length === 0) {
          report.violations.push({
            pluginId: manifest.id,
            type: 'undisclosed_endpoints',
            message: `Plugin "${manifest.name}" uses external communication without disclosing endpoints`,
          });
          report.passed = false;
        }
        
        if (!manifest.dataDisclosure.privacyPolicyUrl) {
          report.violations.push({
            pluginId: manifest.id,
            type: 'missing_privacy_policy',
            message: `Plugin "${manifest.name}" uses external communication but did not provide a privacy policy URL`,
          });
          report.passed = false;
        }
        
        report.disclosures.push({
          pluginId: manifest.id,
          pluginName: manifest.name,
          type: 'external_communication',
          endpoints: manifest.dataDisclosure.externalEndpoints || [],
          privacyPolicy: manifest.dataDisclosure.privacyPolicyUrl,
        });
      }
      
      // Check data collection disclosure
      if (manifest.dataDisclosure.collectsData) {
        if (!manifest.dataDisclosure.collectedData || manifest.dataDisclosure.collectedData.length === 0) {
          report.violations.push({
            pluginId: manifest.id,
            type: 'missing_collected_data_details',
            message: `Plugin "${manifest.name}" collects data but does not disclose what is collected`,
          });
          report.passed = false;
        }
        
        report.disclosures.push({
          pluginId: manifest.id,
          pluginName: manifest.name,
          type: 'data_collection',
          dataCollected: manifest.dataDisclosure.collectedData || [],
          retention: manifest.dataDisclosure.retentionPeriod || 'unknown',
        });
      }
      
      // Check PII handling
      if (manifest.compliance.piiHandling !== 'none') {
        if (manifest.compliance.piiHandling === 'stored' || manifest.compliance.piiHandling === 'processed') {
          report.warnings.push({
            pluginId: manifest.id,
            type: 'pii_handling',
            message: `Plugin "${manifest.name}" handles PII: ${manifest.compliance.piiHandling}. Ensure explicit user consent.`,
          });
        }
      }
    }
    
    return report;
  }
  
  /**
   * Generate user-facing disclosure notice
   */
  static generateDisclosureNotice(report: ComplianceReport): string {
    if (report.disclosures.length === 0) return '';
    
    let notice = '## 🔒 Data Handling Disclosures\n\n';
    notice += 'The following extensions are active and may handle data:\n\n';
    
    for (const disclosure of report.disclosures) {
      notice += `### ${disclosure.pluginName}\n`;
      
      if (disclosure.type === 'external_communication') {
        notice += `- **External endpoints:** ${disclosure.endpoints?.join(', ') || 'None disclosed'}\n`;
        if (disclosure.privacyPolicy) {
          notice += `- **Privacy Policy:** ${disclosure.privacyPolicy}\n`;
        }
      }
      
      if (disclosure.type === 'data_collection') {
        notice += `- **Data collected:** ${disclosure.dataCollected?.join(', ') || 'None disclosed'}\n`;
        notice += `- **Retention:** ${disclosure.retention || 'Unknown'}\n`;
      }
      
      notice += '\n';
    }
    
    return notice;
  }
}
