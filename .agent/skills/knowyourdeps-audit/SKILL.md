---
name: knowyourdeps-audit
description: >-
  Audit all project dependencies (direct and transitive) for CVE security vulnerabilities and
  generate comprehensive Markdown and CSV reports in the output/ folder using the KnowYourDeps MCP server.
  Scans every package in package.json and package-lock.json (all direct and transitive packages),
  and for requirements.txt resolves and audits all installed dependent packages. Uses OSV.dev,
  deps.dev v3, NVD, and GitHub Advisories with exact semver bounds. Use whenever asked to audit
  dependencies, check for vulnerabilities, inspect a lockfile or manifest, or produce compliance reports.
metadata:
  version: 1.4.0
---

# KnowYourDeps Vulnerability Audit & Compliance Skill

This skill instructs AI agents on how to execute end-to-end dependency security audits using the **KnowYourDeps MCP Server** (FastAPI-powered) or fallback security APIs.

It standardizes the workflow for:
1. Asking the user clarifying questions to align on **audit scope** (full project vs. single manifest vs. single package) and **report inclusion** (all packages vs. CVEs only)
2. Auditing **single packages and versions** on-demand without needing manifest files
3. Discovering and parsing dependency manifests (`requirements.txt`, `package.json`, `package-lock.json`)
4. Auditing **each and every package** in `package.json` and `package-lock.json` (all direct, dev, and transitive dependencies)
5. For `requirements.txt`, resolving and auditing all installed dependent packages (transitive dependencies)
6. Determining actual version impact with exact semver range evaluation (filtering out false positives)
7. Generating dual compliance deliverables inside the **`output/`** folder: `output/vulnerability-report.md` and `output/vulnerability-report.csv`
8. Formulating immediate CLI fix guidance and suggesting verified modern alternatives

---

## 1. Trigger Conditions

Activate this skill when:
- The user requests a security or vulnerability audit of their project dependencies
- The user asks to audit a **single package or specific version** (e.g. "audit lodash 4.17.15", "check requests 2.25.0", or "is marked 18.2.1 safe?") without needing a manifest file
- The user mentions checking `requirements.txt`, `package.json`, `package-lock.json`, or Pipfile/poetry
- The user asks for a CVE vulnerability report or CSV export of known security issues
- The user asks if any dependencies in their repository are unmaintained, deprecated, or vulnerable
- The user wants safe, modern replacement packages for risky dependencies

---

## 2. Server Configuration

Connect to the live KnowYourDeps MCP cloud endpoint (zero local Python dependencies needed):

- **Streamable HTTP (Antigravity / modern clients once `/mcp` is deployed):**
```json
{
  "mcpServers": {
    "knowyourdeps": {
      "url": "https://knowyourdeps-mcp.onrender.com/mcp"
    }
  }
}
```

- **Legacy SSE via `mcp-remote` stdio bridge (works for Antigravity, Cursor, and Claude Desktop):**
```json
{
  "mcpServers": {
    "knowyourdeps": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://knowyourdeps-mcp.onrender.com/sse"]
    }
  }
}
```

Or for local development:
```json
{
  "mcpServers": {
    "knowyourdeps": {
      "command": "uvx",
      "args": ["knowyourdeps-mcp"]
    }
  }
}
```

---

## 3. Interactive Clarification Questions (Scope & Inclusion Protocol)

Before executing a scan or generating deliverables, the agent **MUST** check whether the user has specified their audit scope and reporting preferences. If not specified, the agent should ask the user two questions:

### Question 1: Audit Scope
> **"Which dependencies would you like to audit?"**
> - **Full Workspace Audit (Recommended):** Scan all discovered manifests (`package.json`, `package-lock.json`, `requirements.txt`) including all direct and transitive supply-chain dependencies.
> - **Single Manifest / Specific File:** Audit only one specific file (e.g., only `requirements.txt` or only `package.json` / `package-lock.json`).
> - **Single Package & Version:** Audit an individual package on demand (e.g. `marked@18.2.1` or `requests@2.25.0`).

### Question 2: Report & Excel Inclusion Preference
> **"What should be included in the Markdown report and CSV/Excel file?"**
> - **All Packages (Full Compliance / SBOM):** Include every package inspected—both clean packages (0 CVEs) and vulnerable packages—for complete compliance proof and record of inspection.
> - **Vulnerabilities Only (Action-Oriented / Compact):** Include only packages with active CVE vulnerabilities and their remediation action plans, omitting clean packages from the detailed tables and CSV rows.

---

### How to Apply the User's Choices:
- **Full Audit:** Discover all manifests. For npm, parse `package-lock.json` (`max_depth: -1`). For Python, parse `requirements.txt` (`include_transitive: true`).
- **Single Manifest:** Parse only the targeted file (e.g., `parse_requirements_txt` for `requirements.txt` or `parse_lock_file` for `package-lock.json`).
- **Single Package:** Directly run Workflow A (Ad-Hoc single package) without parsing manifests.
- **Report Inclusion:**
  - If user selects **All Packages**: Pass `include_clean_packages: true` to `generate_vulnerability_report_md` and `generate_vulnerability_report_csv`.
  - If user selects **Vulnerabilities Only**: Pass `include_clean_packages: false` to `generate_vulnerability_report_md` and `generate_vulnerability_report_csv`.

---

## 4. Core Execution Protocol

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DISCOVERY    Search workspace for dependency manifests   │
│                 (requirements.txt, package.json, lockfiles) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. PARSING      Parse manifests via MCP tools.              │
│                 - For npm: parse package-lock.json to get   │
│                   EVERY direct and transitive package.      │
│                 - For Python: parse requirements.txt.       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. SCANNING     Call scan_vulnerabilities with ALL packages.│
│                 - For Python, set include_transitive: true  │
│                   to resolve and audit all dependent pkgs.  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 4. ENRICHMENT   Call suggest_alternatives for vulnerable    │
│                 dependencies; call get_fix_guidance         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 5. REPORTING    Save reports inside the output/ folder:     │
│                 - output/vulnerability-report.md            │
│                 - output/vulnerability-report.csv           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 6. DELIVERY     Summarize critical action items in chat;    │
│                 link to created files in the output/ folder │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Step-by-Step Agent Workflow

### Workflow A: Single Package & Version Audit (Ad-Hoc / No Manifest Required)

When the user specifies an individual package and version directly in chat (e.g., "is marked@18.2.1 safe?", "check requests 2.25.0", or "audit lodash 4.17.15"):
1. **Skip file discovery and parsing.**
2. **Directly invoke `scan_vulnerabilities`** with a 1-item package target list:
   ```json
   {
     "packages": [
       {
         "name": "marked",
         "version": "18.2.1",
         "ecosystem": "npm",
         "group": "dependencies"
       }
     ],
     "include_transitive": false,
     "severity_threshold": "ALL"
   }
   ```
3. If vulnerabilities exist (`status == "vulnerable"`):
   - Call `get_fix_guidance` to retrieve upgrade commands.
   - Call `suggest_alternatives` to retrieve modern replacement packages.
4. Report status, CVE identifiers, CVSS scores, affected ranges, and exact fix commands immediately in chat.

---

### Workflow B: Full Workspace / Manifest Audit

#### Step 1: Discover Dependency Manifests

Inspect the workspace to find relevant manifest files:

- **Python (PyPI):** `requirements.txt`, `requirements-dev.txt`, `pyproject.toml`, `uv.lock`, `poetry.lock`
- **Node.js (npm):** `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`

### Step 2: Parse Manifests & Lockfiles

> **Remote Cloud MCP Rule:** Always read the file locally in your agent environment and pass its text or JSON object via **`content`** (remote MCP servers cannot access your local disk via `file_path`). Use `file_path` only when running a local `stdio` server (`uvx knowyourdeps-mcp`).

#### For npm Projects (`package-lock.json` or `package.json`):
When `package-lock.json` is present, **always parse `package-lock.json`** with `max_depth: -1` so that **each and every package (direct and transitive)** is included in the scan:
```json
{
  "content": "<raw JSON string or parsed JSON object of package-lock.json>",
  "max_depth": -1
}
```
If only `package.json` is available, parse `package.json` with `include_dev: true`:
```json
{
  "content": "<raw JSON string or parsed JSON object of package.json>",
  "include_dev": true
}
```

#### For Python Projects (`requirements.txt`):
Parse `requirements.txt`:
```json
{
  "content": "<raw text content of requirements.txt>"
}
```

#### For Any Other Manifest or Lockfile (`pyproject.toml`, `uv.lock`, `poetry.lock`, `yarn.lock`, `pnpm-lock.yaml`):
Call the unified auto-detect parser `parse_manifest`:
```json
{
  "content": "<raw file text or JSON object>",
  "filename": "pyproject.toml"
}
```

---

### Step 3: Run Multi-Source Vulnerability Scan

Call `scan_vulnerabilities` with all parsed packages:

- **For npm with `package-lock.json`:** Pass all parsed direct and transitive packages (`include_transitive: false` since lockfile already expanded all packages).
- **For Python `requirements.txt`:** Pass all requirements with **`include_transitive: true`** so the scanner automatically inspects all installed dependent packages via PyPI metadata:

```json
{
  "packages": [
    { "name": "flask", "version": "3.0.0", "ecosystem": "pypi", "group": "dependencies" },
    { "name": "requests", "version": "2.31.0", "ecosystem": "pypi", "group": "dependencies" }
  ],
  "include_transitive": true,
  "severity_threshold": "ALL"
}
```

#### Understanding the Scanner Output:
- **`status`**: `"safe"` (no matching CVEs in current version) vs `"vulnerable"` (active CVEs affect this exact version).
- **`affects_installed_version`**: Evaluated via semver ranges (`introduced`, `fixed`, `last_affected`). Only advisories where this flag is `true` represent active risks to the current build.
- **`clean_packages`**: List of packages with 0 active vulnerabilities.
- **`vulnerable_packages`**: List of packages requiring remediation.

---

### Step 4: Enrich with Alternatives & Fix Guidance

For each vulnerable package:
1. **Fetch fix command:**
   Call `get_fix_guidance`:
   ```json
   {
     "package_name": "marked",
     "current_version": "18.2.1",
     "ecosystem": "npm",
     "vulnerability_id": "GHSA-6v9c-7cg6-27q7"
   }
   ```
2. **Fetch modern alternatives:**
   Call `suggest_alternatives`:
   ```json
   {
     "name": "lodash",
     "ecosystem": "npm",
     "limit": 3
   }
   ```

---

### Step 5: Generate Compliance Deliverables in `output/`

Always ensure **both** deliverables exist locally inside the project's **`output/`** folder. When using a remote MCP server, write the returned `content` string directly to local `output/vulnerability-report.md` and `output/vulnerability-report.csv`.

#### 1. Markdown Report (`output/vulnerability-report.md`)
Call `generate_vulnerability_report_md`:
```json
{
  "scan_result": "<scan_result_data>",
  "output_path": "output/vulnerability-report.md",
  "project_name": "<Project Name>",
  "include_clean_packages": true
}
```
*(Pass `include_clean_packages: false` if the user opted for a compact, CVE-only report).*

#### 2. CSV Report (`output/vulnerability-report.csv`)
Call `generate_vulnerability_report_csv`:
```json
{
  "scan_result": "<scan_result_data>",
  "output_path": "output/vulnerability-report.csv",
  "include_clean_packages": true
}
```
*(Pass `include_clean_packages: false` if the user wants only vulnerable packages in the CSV/Excel sheet).*

---

## 6. Standard Markdown Report Template

The Markdown report in `output/vulnerability-report.md` follows this structure:

```markdown
# 🔒 Dependency Vulnerability Audit Report — {Project Name}

> **Audit Date:** {YYYY-MM-DD HH:MM UTC}
> **Engines Consulted:** OSV.dev v1 · Google deps.dev v3 · NVD NIST 2.0 · GitHub Security Advisories
> **Target Manifests:** `{manifest}` (audited {total} packages including all transitive dependencies)

---

## 1. Executive Summary

| Metric | Count | Status |
|---|---|---|
| **Total Packages Audited** | {total} | — |
| **Clean Packages (0 CVEs)** | {clean_count} | 🟢 Compliant |
| **Vulnerable Packages** | {vuln_count} | {🔴 Action Required / 🟢 Clean} |
| **Active CVEs Affecting Project** | {active_cve_count} | — |
| 🔴 **Critical Severity** | {crit_count} | Immediate mitigation needed |
| 🟠 **High Severity** | {high_count} | Patch promptly |
| 🟡 **Medium Severity** | {med_count} | Review schedule |
| 🟢 **Low Severity** | {low_count} | Informational |

**Risk Assessment:** {HIGH / MEDIUM / LOW / NONE}

---

## 2. 🚨 Vulnerable Packages & Action Plans

### {package_name} @ `{installed_version}` ({ecosystem})
- **Status:** ⚠️ Active Vulnerability Detected
- **Dependency Type:** {Direct / Transitive} · {Production / Development}
- **Recommended Upgrade:** `{fixed_version}`

#### Advisories Affecting `{installed_version}`:

##### 🔴 {CVE-ID or GHSA-ID} — {SEVERITY} (CVSS: {score})
- **Title:** {Advisory Summary}
- **CWE:** {CWE-ID - Name}
- **Affected Version Range:** `{affected_range}`
- **Patched In:** `{fixed_version}`
- **Published Date:** {date}

> **Vulnerability Overview:**
> {2-3 sentences explaining the exploit scenario and attack vector.}

**Remediation Steps:**
```bash
{npm install <package>@<fixed_version> OR pip install --upgrade <package>==<fixed_version>}
```

**Official References:**
- [NVD Record]({nvd_url})
- [GitHub Security Advisory]({github_url})
- [OSV Database]({osv_url})

---

## 3. 🔄 Safer & Modern Package Alternatives

| Vulnerable Package | Recommended Alternative | Weekly Downloads | License | Key Benefits |
|---|---|---|---|---|
| `{vuln_pkg}` | **`{alt_pkg}`** | {downloads} | {license} | {reasons: e.g. Zero-dependency, tree-shakable} |

---

## 4. ✅ Clean Packages ({clean_count})

| # | Package | Audited Version | Ecosystem | Type |
|---|---|---|---|---|
| 1 | `{pkg}` | `{version}` | `{npm/pypi}` | `{Direct/Transitive/Dev}` |

---

## 5. 📋 Complete Vulnerability Identifier Index

| Advisory ID | Primary CVE ID | Target Package | Severity | Fixed In Version |
|---|---|---|---|---|
| `{id}` | `{cve}` | `{pkg}` | `{SEVERITY}` | `{fixed_ver}` |

---
*Generated by KnowYourDeps Audit Engine.*
```

---

## 7. Standard CSV Schema

The CSV file (`output/vulnerability-report.csv`) adheres to these 21 headers:

```csv
package_name,version,ecosystem,dependency_group,status,vulnerability_id,cve_id,ghsa_id,severity,cvss_score,cvss_vector,cwe,title,affected_range,installed_version_affected,fixed_version,published_date,summary,nvd_url,github_url,osv_url
```

### Data Formatting Rules for CSV:
1. **Encoding:** UTF-8 with BOM (`\ufeff`) so Microsoft Excel parses accented characters and symbols without prompt.
2. **Quoting:** Enclose all text fields containing commas, quotes, or newlines in double quotes (`"..."`).
3. **Newlines:** Strip raw carriage returns (`\r\n`) inside description/summary fields and replace with ` | ` to preserve row integrity.
4. **Clean Packages:** When `include_clean_packages: true`, every clean package has one row with `status=CLEAN` and empty vulnerability columns for audit verification. When `include_clean_packages: false`, clean rows are excluded so the CSV contains only vulnerable packages.
5. **Multiple CVEs:** If a package has 3 vulnerabilities, output 3 distinct rows for that package (one per vulnerability).

---

## 8. Edge Cases & Guardrails

| Edge Case | Required Handling |
|---|---|
| **Unbounded / Canary Ranges** | When an advisory has `last_affected` or canary versions (e.g. `16.0.0-beta.0`), do not flag production releases beyond the fixed version. Match using `<= last_affected`. |
| **All Transitive Packages** | For complete audits, `package-lock.json` must be traversed completely. All direct and transitive packages must be included. |
| **Python Dependent Packages** | When auditing `requirements.txt`, pass `include_transitive: true` to resolve and audit all dependent packages. |
| **Output Directory** | Always save reports into the `output/` folder (`output/vulnerability-report.md` and `output/vulnerability-report.csv`), creating the folder if it does not exist. |
| **Private / Internal Packages** | If a package is not found in public registries (returns 404), mark status as `UNREGISTERED_OR_PRIVATE` and proceed without failing the whole audit. |
| **No API Key Available** | OSV.dev and deps.dev require NO keys. If NVD is rate-limited (HTTP 429), fall back smoothly to OSV severity ratings and continue. |

---

## 9. Delivery Summary in Chat

After completing the audit and saving both reports in `output/`, provide a concise 3-part chat summary:

1. **The Numbers:** Total packages scanned (direct + transitive), clean count, vulnerable count, breakdown of Critical/High/Medium/Low.
2. **Top Priority Action Items:** The 1 to 3 most severe vulnerabilities with copy-pasteable fix commands (`npm install ...` or `pip install ...`).
3. **Artifact Links:** Clickable file links to `[output/vulnerability-report.md](file:///path/to/output/vulnerability-report.md)` and `[output/vulnerability-report.csv](file:///path/to/output/vulnerability-report.csv)`.
