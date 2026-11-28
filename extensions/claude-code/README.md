# KnowYourDeps Plugin for Claude Code

Security intelligence for **npm** and **PyPI** dependencies inside Claude Code, powered by the remote KnowYourDeps MCP server (`https://knowyourdeps-mcp.onrender.com/sse`). Works across **Windows, macOS, and Linux** with zero local Python dependencies and no authentication required.

## Installation

### Option 1: Via Marketplace (Recommended)
Run inside Claude Code:
```text
/plugin marketplace add MYSELF-SAYAN/knowyourdeps
/plugin install knowyourdeps@knowyourdeps
```

Or from your terminal:
```bash
claude plugin marketplace add MYSELF-SAYAN/knowyourdeps
claude plugin install knowyourdeps@knowyourdeps
```

### Option 2: Test Locally Without Publishing
From the repository root:
```bash
claude --plugin-dir ./extensions/claude-code
```

Validate plugin structure and manifests:
```bash
claude plugin validate ./extensions/claude-code
claude plugin validate .
```

## Available Skills & Commands

| Command | Purpose |
|---|---|
| `/knowyourdeps:audit [path]` | Audit manifests & lockfiles (`package-lock.json`, `package.json`, `requirements.txt`, `uv.lock`, `poetry.lock`, etc.) across direct + transitive trees and save `output/vulnerability-report.md` & `.csv`. |
| `/knowyourdeps:check <pkg> [ver]` | Pre-install CVE check for a single package and version (with safe patched versions & alternatives). |
| `/knowyourdeps:upgrade <pkg> [ver]` | Conflict-free transitive upgrade planning (`resolve_safe_upgrade`, `simulate_upgrade_impact`, `get_upgrade_plan`). |

Claude also automatically invokes `/knowyourdeps:audit` when you ask it to *"audit dependencies"* or *"check for CVEs"*.

## Remote MCP Transport Notes

- Configured in [`.mcp.json`](./.mcp.json) using SSE (`"type": "sse"`, `"url": "https://knowyourdeps-mcp.onrender.com/sse"`).
- The server also supports Streamable HTTP at `https://knowyourdeps-mcp.onrender.com/mcp` (`"type": "http"`), which is recommended if you migrate away from legacy SSE later.
- If the Render free-tier service was idle, the first SSE handshake may take 15–30 seconds to wake up.
