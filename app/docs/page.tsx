'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ComparisonModal } from '@/components/ComparisonModal';
import { ComparisonTarget } from '@/lib/types';
import {
  Copy,
  Check,
  ArrowLeft,
  Terminal,
  MessageSquare,
  FileText,
  Table as TableIcon,
  Sparkles,
} from 'lucide-react';

function DocsContent() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(true);

  // Compare modal state for global parity with landing page
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargets, setCompareTargets] = useState<ComparisonTarget[]>([
    { ecosystem: 'npm', name: 'axios' },
    { ecosystem: 'npm', name: 'got' },
  ]);

  const openCompareModal = () => {
    setIsCompareOpen(true);
  };

  const copyCode = (id: string, text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    } catch {
      // Ignored
    }
  };

  const MCP_ENDPOINT = 'https://knowyourdeps-mcp.onrender.com/sse';
  const SKILL_CMD = 'npx skills add MYSELF-SAYAN/knowyourdeps';
  const AGENT_PROMPT = `Install KnowYourDeps and connect it to this coding agent using ${SKILL_CMD} and configure the MCP server at ${MCP_ENDPOINT}. Show me the setup plan for approval, then verify the installation.`;

  const AGENTS = [
    {
      id: 'cursor',
      name: 'Cursor IDE',
      file: '.cursor/mcp.json',
      desc: 'Save in project root or add in Cursor Settings > Features > MCP.',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
    {
      id: 'claude',
      name: 'Claude Desktop',
      file: 'claude_desktop_config.json',
      desc: '%APPDATA%\\Claude (Win) or ~/Library/Application Support/Claude (Mac).',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
    {
      id: 'antigravity',
      name: 'Google Antigravity & Gemini CLI',
      file: '~/.gemini/config/mcp_config.json',
      desc: 'Add to global ~/.gemini/config/mcp_config.json or project workspace.',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
    {
      id: 'vscode',
      name: 'VS Code (Roo Code / Cline)',
      file: 'cline_mcp_settings.json',
      desc: 'Add to Cline or Roo Code extension settings in VS Code.',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a] relative">
      {/* Smokey Sky Atmosphere Aura (tasteskill.dev design system) */}
      <div className="sky-half-screen-bg">
        <div className="sky-clouds-overlay" />
      </div>

      {/* Centered Floating Animated Navbar */}
      <header className="sticky top-3.5 z-40 w-full flex justify-center px-4 pointer-events-none">
        <Navbar onOpenCompare={openCompareModal} />
      </header>

      {/* Clean, Non-Bloated Header */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-6 mt-4 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#64748b] hover:text-[#1d53c6] transition-colors mb-3 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Search</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
          <div>
            <h1 className="font-display text-[26px] sm:text-[34px] font-bold tracking-tight text-[#0f172a]">
              AI Agent &amp; MCP Setup
            </h1>
            <p className="mt-1 text-[14px] text-[#64748b]">
              Install the security audit skill and connect your coding agent to the live cloud scanner.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#e2e8f0] text-[11px] font-medium text-[#0f172a] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span>MCP Cloud: Online</span>
          </div>
        </div>
      </div>

      {/* Main Single-Column Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-12 relative z-10">
        {/* Step 1: Install the Skill (Prominently on top as requested) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1d53c6] text-white font-mono text-[11px] font-bold">
              1
            </span>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
              Install the Audit Skill (skills.sh)
            </h2>
          </div>
          <p className="text-[13.5px] text-[#64748b]">
            Run this in your project terminal. It auto-detects Cursor, Claude Code, Antigravity, or VS Code and sets up the skill instructions:
          </p>

          <div className="bg-[#0f172a] rounded-[14px] p-3.5 sm:p-4 border border-[#1e293b] text-[#f8fafc] shadow-md">
            <div className="flex items-center justify-between gap-3 text-[12.5px]">
              <div className="font-mono text-[#93c5fd] truncate select-all">
                <span className="text-[#64748b] mr-2 select-none">$</span>
                {SKILL_CMD}
              </div>
              <button
                type="button"
                onClick={() => copyCode('skill-cmd', SKILL_CMD)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white text-[11px] font-mono transition-colors cursor-pointer shrink-0 select-none"
              >
                {copiedId === 'skill-cmd' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Step 2: Connect KnowYourDeps (Autonomous Agent Prompt + Collapsible Manual Setup) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1d53c6] text-white font-mono text-[11px] font-bold">
              2
            </span>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
              Connect KnowYourDeps
            </h2>
          </div>
          <p className="text-[13.5px] text-[#64748b]">
            Copy this into your coding agent:
          </p>

          {/* Primary Prompt Card */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-[16px] overflow-hidden shadow-xl text-white">
            {/* Top Bar with subtle 3 dots and Copy button */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e293b]/70 border-b border-[#334155]/60">
              <div className="flex items-center gap-2 select-none">
                <span className="text-[#64748b] font-mono tracking-widest text-[13px]">
                  •••
                </span>
                <span className="text-[12px] font-mono text-[#94a3b8] font-medium">
                  Your coding agent
                </span>
              </div>

              <button
                type="button"
                onClick={() => copyCode('agent-prompt', AGENT_PROMPT)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-mono text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
              >
                {copiedId === 'agent-prompt' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt Body with leading bracket and pulsing block cursor */}
            <div className="p-4 sm:p-5 font-mono text-[13px] sm:text-[13.5px] leading-relaxed text-[#f8fafc] select-all">
              <span className="text-[#64748b] select-none font-bold mr-2">&gt;</span>
              <span>{AGENT_PROMPT}</span>
              <span className="inline-block w-2.5 h-4.5 bg-[#38bdf8] ml-1.5 align-middle animate-pulse" />
            </div>
          </div>

          {/* Collapsible Section: "Or run setup yourself" */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsManualOpen(!isManualOpen)}
              className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#64748b] hover:text-[#1d53c6] transition-colors cursor-pointer select-none py-1 group"
            >
              <span className="text-[11px] text-[#1d53c6] transition-transform duration-150">
                {isManualOpen ? '▼' : '▶'}
              </span>
              <span className="group-hover:underline">Or run setup yourself</span>
            </button>

            {isManualOpen && (
              <div className="mt-3.5 space-y-5 pl-1 sm:pl-3 border-l-2 border-[#e2e8f0] transition-all">
                {/* Terminal Subcard */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-[14px] overflow-hidden shadow-md">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b]/60 border-b border-[#334155]/60">
                    <span className="text-[12px] font-mono text-[#94a3b8] font-medium">
                      Terminal
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode('terminal-cmd', SKILL_CMD)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-mono text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
                    >
                      {copiedId === 'terminal-cmd' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 sm:p-4 font-mono text-[13px] text-[#93c5fd] select-all">
                    {SKILL_CMD}
                  </div>
                </div>

                {/* Subheading for Client Configs */}
                <div className="text-[13px] text-[#475569] font-medium pt-1">
                  For one specific client, add its configuration:
                </div>

                {/* Visible Client Configuration Cards (No Hidden Tabs, Clean Light Aesthetics) */}
                <div className="space-y-3.5">
                  {AGENTS.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-white rounded-[16px] border border-[#e2e8f0] p-4 sm:p-5 shadow-xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[13.5px] text-[#0f172a]">
                          {agent.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#1d53c6] bg-[#eff6ff] px-2.5 py-0.5 rounded-md border border-[#bfdbfe]/60">
                          {agent.file}
                        </span>
                      </div>
                      <div className="text-[12px] text-[#64748b]">{agent.desc}</div>

                      <div className="bg-[#0f172a] rounded-[12px] p-3 border border-[#1e293b] text-[#f8fafc]">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b] text-[11px] text-[#94a3b8]">
                          <span className="font-mono">JSON Configuration</span>
                          <button
                            type="button"
                            onClick={() => copyCode(agent.id, agent.config)}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white text-[11px] font-mono transition-colors cursor-pointer select-none"
                          >
                            {copiedId === agent.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="font-mono text-[12px] text-[#93c5fd] overflow-x-auto leading-relaxed select-all">
                          <code>{agent.config}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: How to Use in Agent Chat */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1d53c6] text-white font-mono text-[11px] font-bold">
              3
            </span>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
              How to Use in Agent Chat
            </h2>
          </div>
          <p className="text-[13.5px] text-[#64748b]">
            Ask your agent in plain English. The skill will automatically guide the workflow and resolve exact semver bounds:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-[12.5px]">
            <div className="p-4 rounded-[16px] bg-white border border-[#e2e8f0] shadow-xs space-y-2">
              <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#1d53c6]" />
                <span>Full Project Audit</span>
              </div>
              <p className="font-mono text-[11.5px] text-[#334155] bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                &quot;Audit all dependencies in this workspace for security vulnerabilities.&quot;
              </p>
            </div>

            <div className="p-4 rounded-[16px] bg-white border border-[#e2e8f0] shadow-xs space-y-2">
              <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#1d53c6]" />
                <span>Single Package Check</span>
              </div>
              <p className="font-mono text-[11.5px] text-[#334155] bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                &quot;Is marked@18.2.1 affected by any active CVEs? If so, how to fix it?&quot;
              </p>
            </div>

            <div className="p-4 rounded-[16px] bg-white border border-[#e2e8f0] shadow-xs space-y-2">
              <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#1d53c6]" />
                <span>Targeted File &amp; CSV</span>
              </div>
              <p className="font-mono text-[11.5px] text-[#334155] bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                &quot;Scan requirements.txt and save a CSV report of vulnerable packages to output/&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Step 4: Saved Deliverables */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1d53c6] text-white font-mono text-[11px] font-bold">
              4
            </span>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
              Saved Deliverables
            </h2>
          </div>
          <p className="text-[13.5px] text-[#64748b]">
            Reports are created inside your project&apos;s <code className="font-mono text-[#1d53c6] font-semibold bg-[#eff6ff] px-1.5 py-0.5 rounded border border-[#bfdbfe]/60">output/</code> directory:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[12.5px]">
            <div className="p-4 rounded-[16px] bg-white border border-[#e2e8f0] flex items-start gap-3 shadow-xs">
              <FileText className="h-4 w-4 text-[#1d53c6] shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-[12.5px] font-bold text-[#0f172a]">
                  output/vulnerability-report.md
                </div>
                <div className="text-[#64748b] text-[12px] mt-1 leading-relaxed">
                  Executive summary table, active CVEs with CVSS scores, remediation commands, and safer alternatives.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-white border border-[#e2e8f0] flex items-start gap-3 shadow-xs">
              <TableIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-[12.5px] font-bold text-[#0f172a]">
                  output/vulnerability-report.csv
                </div>
                <div className="text-[#64748b] text-[12px] mt-1 leading-relaxed">
                  21-column Excel-compatible dataset with UTF-8 BOM encoding for compliance archiving and security reviews.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Unified Footer */}
      <Footer onOpenCompare={openCompareModal} />

      {/* Comparison Drawer / Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialPackages={compareTargets}
      />
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <div className="w-8 h-8 border-2 border-[#1d53c6] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DocsContent />
    </Suspense>
  );
}
