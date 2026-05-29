# Security Policy

## Scope

FitDesk is a local-only Android app with no backend, no network requests, and no user accounts. All data is stored on-device via SQLite.

Security concerns most likely to be relevant:
- Data exposure via exported files (backup/export feature)
- Insecure local storage of sensitive fitness/payment data
- Dependency vulnerabilities

## Reporting a Vulnerability

Do **not** open a public GitHub issue for security vulnerabilities.

Instead, report privately via GitHub's [Security Advisories](https://github.com/elanandkumar/FitDesk/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You'll receive a response within 7 days. If confirmed, a fix will be prioritized and credited to you in the release notes.
