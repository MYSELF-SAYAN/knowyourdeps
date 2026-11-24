# DepsDive — Dependency Security Intelligence & Audit Skill

A high-performance modern web dashboard and AI agent companion skill for multi-engine supply-chain security auditing, CVE analysis, and automated compliance reporting.

---

## ⚡ Features

- **Multi-Source Vulnerability Intelligence:** Cross-referenced in real-time across **OSV.dev v1**, **Google deps.dev v3**, **NVD NIST 2.0**, and **GitHub Security Advisories**.
- **Interactive Security Dashboard:** Search packages across npm and PyPI, filter active vs. historical CVEs, review CVSS v3.1 vectors, and inspect exact affected version bounds.
- **Dual Compliance Deliverables:** Generates comprehensive **Markdown reports** and **21-column Excel-compatible CSV datasets** (with UTF-8 BOM encoding).
- **AI Agent Skill Included:** Bundled with the official `knowyourdeps-audit` skill for AI agents (Antigravity, Cursor, Claude Code, Windsurf, Roo Code).

---

## 🤖 Using the AI Agent Skill (`knowyourdeps-audit`)

This repository includes the complete audit skill in [`skills/knowyourdeps-audit/SKILL.md`](skills/knowyourdeps-audit/SKILL.md).

### 1. Install via `skills.sh`
```bash
npx skills add <YOUR-GITHUB-USERNAME>/client
```

### 2. Quick One-Line Install into Any Project

**macOS / Linux / Git Bash:**
```bash
mkdir -p .agent/skills/knowyourdeps-audit && curl -sSL https://raw.githubusercontent.com/<YOUR-GITHUB-USERNAME>/<REPO-NAME>/main/skills/knowyourdeps-audit/SKILL.md -o .agent/skills/knowyourdeps-audit/SKILL.md
```

**Windows PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path .agent/skills/knowyourdeps-audit; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/<YOUR-GITHUB-USERNAME>/<REPO-NAME>/main/skills/knowyourdeps-audit/SKILL.md" -OutFile ".agent/skills/knowyourdeps-audit/SKILL.md"
```

### 3. Connect to the Live MCP Server
Add your live MCP endpoint (e.g., hosted on Render or local) to your agent's MCP configuration (`mcp_config.json`, `.cursor/mcp.json`, or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "knowyourdeps": {
      "url": "https://<your-mcp-service>.onrender.com/sse"
    }
  }
}
```

---

## 💻 Running the Web Client Locally

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## 🚀 Deploying to Vercel

The web client is built with Next.js App Router and deploys seamlessly to Vercel with 1 click:

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) ➔ **Add New Project**.
3. Import your repository and click **Deploy**.
