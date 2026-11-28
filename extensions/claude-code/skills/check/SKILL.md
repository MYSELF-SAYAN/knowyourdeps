---
name: check
description: >-
  Check a single npm or PyPI package and version for CVEs, affected ranges, and safer upgrades or
  alternatives before installing. Use when the user runs /knowyourdeps:check or asks whether a
  specific package@version (e.g. axios@1.6.0 or requests==2.31.0) is safe.
argument-hint: "<package> [version] [npm|pypi]"
---

# KnowYourDeps Single-Package Security Check

Inspect `$ARGUMENTS` for known CVEs using the **`knowyourdeps`** remote MCP server before installing.

## Instructions

1. Parse `$ARGUMENTS` to extract:
   - `name` (e.g. `axios`, `@scope/pkg`, `requests`)
   - `version` (if omitted, scan unpinned or note that latest advisories are checked; strip leading `v` or `==` / `@` separator cleanly)
   - `ecosystem`: `"npm"` or `"pypi"` (infer from context/workspace manifests if not explicitly provided).
2. Call `scan_vulnerabilities`:
   ```json
   {
     "packages": [
       { "name": "<name>", "version": "<version>", "ecosystem": "<npm|pypi>", "group": "dependencies" }
     ],
     "include_transitive": false,
     "severity_threshold": "ALL"
   }
   ```
3. If `status == "vulnerable"`:
   - Call `resolve_safe_upgrade` to find the nearest CVE-free patched version.
   - Call `get_fix_guidance` for the top advisory to get exact install commands and compatibility notes.
   - Optionally call `suggest_alternatives` (`limit: 3`) if the vulnerability is Critical/High or the package is risky.
4. Reply concisely with:
   - Verdict (**Safe** vs **Vulnerable**) for `name@version` (`ecosystem`)
   - Any active CVE / GHSA IDs, severity ratings, CVSS scores, and OSV/NVD links
   - Exact safe install command (e.g. `npm install <name>@<safe_version>` or `pip install <name>==<safe_version>`).
