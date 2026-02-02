# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Llama Wrangler, please send an email to the project maintainers. All security vulnerabilities will be promptly addressed.

Please include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Update Process

1. The security report is received and assigned to a primary handler
2. The problem is confirmed and a list of affected versions is determined
3. Code is audited to find any similar problems
4. Fixes are prepared for all supported releases
5. New versions are released and the security advisory is published

## General Security Recommendations

- Keep your Llama Wrangler installation up to date
- Only download models from trusted sources
- Be cautious when using custom scripts or plugins
- Review model permissions and capabilities before use
- Use appropriate system-level security measures

## Contact

For security concerns, please contact the maintainers through GitHub issues marked as confidential or via direct message.