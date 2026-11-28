---
name: audit
description: >-
  Audit project dependencies (direct and transitive) for CVE security vulnerabilities and save
  Markdown and CSV reports in ./output/ using the remote KnowYourDeps MCP server. Scans npm
  (package-lock.json, package.json, yarn.lock, pnpm-lock.yaml) and PyPI (requirements.txt,
  pyproject.toml, uv.lock, poetry.lock) with OSV.dev, deps.dev v3, NVD, and GitHub Advisories.
  Use whenever the user asks to audit dependencies, scan manifests/lockfiles for CVEs, or
  generate a dependency vulnerability report.
argument-hint: "[manifest-or-lockfile-path]"
---

# KnowYourDeps Full Dependency Vulnerability Audit

Run an end-to-end dependency CVE audit against `$ARGUMENTS` (or all discovered manifests in the current workspace) using the connected **`knowyourdeps`** remote MCP server.

## Critical Remote MCP Rules

1. **Always read manifest/lockfile contents locally first** using `Read` and pass raw text or parsed JSON via the **`content`** parameter. Never pass `file_path` alone — the remote server at `knowyourdeps-mcp.onrender.com` cannot access your local filesystem.
2. **Never invoke `generate_vulnerability_report_*` and stop**: remote tool calls return report text in `.content` and do not write to the user's disk. Always persist both reports into `./output/` using `${CLAUDE_PLUGIN_ROOT}/scripts/save_reports.py`.

## Workflow

### 1. Discover & Clarify Scope (if ambiguous)
- Search for manifests/lockfiles if `$ARGUMENTS` is empty using `Glob`:
  - **npm**: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `package.json`
  - **PyPI**: `uv.lock`, `poetry.lock`, `pyproject.toml`, `requirements.txt`
- When `package-lock.json` is present, **prefer `package-lock.json`** with `max_depth: -1` so every direct and transitive package is scanned.
- If the user did not specify scope or whether clean packages should appear in reports, briefly confirm:
  1. Audit scope (full workspace vs. specific manifest `$ARGUMENTS`)
  2. Report preference (all packages vs. vulnerabilities only -> `include_clean_packages: true | false`)

### 2. Parse Manifests via MCP
Read the file(s) with `Read`, then call the appropriate parser on **`knowyourdeps`**:
- `package-lock.json` -> `parse_lock_file(content=..., max_depth=-1)`
- `package.json` -> `parse_package_json_manifest(content=..., include_dev=true)`
- `requirements.txt` -> `parse_requirements_txt(content=...)`
- `pyproject.toml`, `uv.lock`, `poetry.lock`, `yarn.lock`, `pnpm-lock.yaml` -> `parse_manifest(content=..., filename=...)`

### 3. Scan for CVEs
Call `scan_vulnerabilities` with the parsed packages:
- For lockfile-expanded npm projects: `include_transitive: false`
- For `requirements.txt` without a lockfile: `include_transitive: true`
- `severity_threshold: "ALL"`

### 4. Resolve Conflict-Free Upgrade Plan
If any packages have `"status": "vulnerable"`:
- Call `get_upgrade_plan` passing `scan_result`, `lockfile_content` / `manifest_content`, and `strategy: "conservative"`.
- For unresolvable packages or replacements, check `suggest_alternatives` and `get_fix_guidance`.

### 5. Save Reports to `./output/`
1. Call `generate_vulnerability_report_md` and `generate_vulnerability_report_csv` with `scan_result` and the chosen `include_clean_packages` flag.
2. Pipe or pass both `.content` payloads to the bundled cross-platform Python helper (replace `python3` with `python` on Windows if needed):
   ```bash
   python3 "${CLAUDE_PLUGIN_ROOT}/scripts/save_reports.py" --json "<temp-reports.json>"
   ```
   Remove the temporary JSON file right after `save_reports.py` exits `0`. (If Python is unavailable, write `output/vulnerability-report.md` and `output/vulnerability-report.csv` with UTF-8 BOM directly.)

### 6. Present Summary
Report:
1. Total packages scanned (direct + transitive), clean count, vulnerable count, and Critical/High/Medium/Low counts.
2. Top priority CVEs (CVE/GHSA ID, severity, affected range, fixed version, and exact upgrade command from `get_upgrade_plan`).
3. Paths created: `./output/vulnerability-report.md` and `./output/vulnerability-report.csv`.
