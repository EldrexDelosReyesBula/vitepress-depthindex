# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.1.x   | ✅ Active support  |
| 1.0.x   | ⚠️ Security only   |
| < 1.0   | ❌ End of life     |

## Reporting a Vulnerability

**DO NOT CREATE A PUBLIC ISSUE** for security vulnerabilities.

Instead, please email:

📧 **eldrexdelosreyesbula@gmail.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact

### Response Timeline

- **24 hours**: Acknowledgment of receipt
- **72 hours**: Initial assessment and confirmation
- **7 days**: Patch release for critical vulnerabilities
- **14 days**: Patch release for high vulnerabilities
- **30 days**: Patch release for medium/low vulnerabilities

### Disclosure Policy

- Vulnerabilities are disclosed **after** a fix is released
- Credit is given to the reporter (unless anonymity requested)
- CVE identifiers requested for critical vulnerabilities

## Security Measures in DepthIndex

| Measure | Description |
|---------|-------------|
| XSS Prevention | DOMParser-based HTML sanitization |
| PII Detection | Automatic detection and masking of personal data |
| Rate Limiting | Query rate limiting to prevent abuse |
| Local-First | No data leaves the device by default |
| No Telemetry | Zero analytics, tracking, or data collection |
| API Key Security | Keys stored in browser localStorage only |
| HTTPS | Cloud AI connections use HTTPS only |
| Dependency Audits | Regular `npm audit` before releases |

## Supply Chain Security

- All releases are published from a clean build
- Dependencies are pinned to exact versions
- `package-lock.json` is committed to the repository
- Releases are signed with npm signatures where available
- Regular security audits with `npm audit`
