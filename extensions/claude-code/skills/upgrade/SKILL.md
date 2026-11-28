---
name: upgrade
description: >-
  Compute a conflict-free, CVE-free upgrade path for one or more dependencies without breaking
  sibling packages or introducing new transitive CVEs. Use when upgrading a vulnerable package or
  running /knowyourdeps:upgrade.
argument-hint: "<package> [target-version]"
---

# KnowYourDeps Conflict-Free Upgrade Planner

Find a safe, non-breaking upgrade for `$ARGUMENTS` using the **`knowyourdeps`** remote MCP server.

## Instructions

1. Discover and read the workspace manifest/lockfile (`package-lock.json`, `package.json`, `requirements.txt`, `pyproject.toml`, `uv.lock`, `poetry.lock`, `yarn.lock`, `pnpm-lock.yaml`) using `Glob` + `Read`.
2. Parse the workspace dependencies using `parse_lock_file` or `parse_manifest` (always pass **`content`**).
3. If the user specified a target version in `$ARGUMENTS`, run `simulate_upgrade_impact` to check for:
   - `broken_consumers` / `broken_dependencies`
   - `new_transitive_deps` & `new_cves_introduced`
   - `cascading_chain` (`A -> B -> C`)
4. Otherwise (or if the candidate introduces breakages/CVEs), call `resolve_safe_upgrade` and/or `scan_vulnerabilities` + `get_upgrade_plan` (`strategy: "conservative"`).
5. If no compatible CVE-free upgrade exists in the registry, call `suggest_alternatives` with `installed_packages` so alternatives are verified against project compatibility and OSV security status.
6. Present the recommended version, cascading updates (leaf dependencies first), rollback command, and copy-pasteable upgrade command. **Wait for user confirmation before modifying manifests or running install commands.**
