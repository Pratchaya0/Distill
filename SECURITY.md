# Security Policy

## Supported Versions

Only the latest release is actively maintained.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately via [GitHub's private vulnerability reporting](https://github.com/Pratchaya0/Distill/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

I'll respond within 72 hours and aim to release a fix within 7 days for critical issues.

## Security Design Notes

- **API keys** are stored in the browser's `localStorage` and sent only to the respective AI provider (Groq/OpenAI). They are never logged or stored server-side.
- **All recording data** lives in the browser's IndexedDB — no data is sent to any server other than the AI provider during transcription/processing.
- **Server-side API routes** proxy requests to Groq — the API key from `.env` never reaches the client bundle.
