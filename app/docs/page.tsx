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
  MessageSquare,
  FileText,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

function DocsContent() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargets] = useState<ComparisonTarget[]>([
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

  const MCP_HTTP_ENDPOINT = 'https://knowyourdeps-mcp.onrender.com/mcp';
  const MCP_SSE_ENDPOINT = 'https://knowyourdeps-mcp.onrender.com/sse';
  const SKILL_CMD = 'npx skills add MYSELF-SAYAN/knowyourdeps';
  const CLAUDE_PLUGIN_CMD = `claude plugin marketplace add MYSELF-SAYAN/knowyourdeps\nclaude plugin install knowyourdeps@knowyourdeps`;
  const AGENT_PROMPT = `Install KnowYourDeps and connect it to this coding agent using ${SKILL_CMD} and configure the MCP server at ${MCP_HTTP_ENDPOINT} (fallback SSE: ${MCP_SSE_ENDPOINT}). Show me the setup plan for approval, then verify the installation.`;

  const AGENTS = [
    {
      id: 'cursor',
      name: 'Cursor IDE',
      file: '.cursor/mcp.json',
      desc: 'Place in project root or configure under Cursor Settings > Tools & MCP (Streamable HTTP).',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_HTTP_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
    {
      id: 'claude',
      name: 'Claude Code (.mcp.json)',
      file: '.mcp.json',
      desc: 'Or install via `claude plugin install knowyourdeps@knowyourdeps` (no auth required).',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              type: 'sse',
              url: MCP_SSE_ENDPOINT,
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
      desc: 'Connects via Streamable HTTP endpoint or mcp-remote stdio bridge.',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_HTTP_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
    {
      id: 'vscode',
      name: 'VS Code (Cline / Roo Code)',
      file: 'cline_mcp_settings.json',
      desc: 'Add to your VS Code MCP extension settings using SSE or Streamable HTTP.',
      config: JSON.stringify(
        {
          mcpServers: {
            knowyourdeps: {
              url: MCP_SSE_ENDPOINT,
            },
          },
        },
        null,
        2
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#0f172a] relative">
      {/* Atmospheric Blue Sky Gradient Spanning Whole Page */}
      <div className="sky-full-page-bg" aria-hidden="true">
        <div className="sky-clouds-overlay" />
      </div>

      {/* Centered Flush Apple Notch Header */}
      <header className="sticky top-0 z-40 w-full flex justify-center px-3 sm:px-6 pointer-events-none">
        <Navbar onOpenCompare={openCompareModal} />
      </header>

      <main id="main-content" className="w-full max-w-[920px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20 relative z-10">
        {/* Hero Header over Zenith Cobalt Sky */}
        <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-11">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#e0f2fe] hover:text-white transition-colors duration-150 mb-5 rounded-full px-3 py-1 bg-white/12 border border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Search</span>
          </Link>

          <h1 className="font-display font-semibold text-[34px] sm:text-[48px] leading-[1.06] tracking-[-0.03em] text-white [text-shadow:0_2px_20px_rgba(3,28,77,0.28)]">
            AI Agent &amp;{' '}
            <span className="font-serif-accent italic font-normal text-[#dff3ff]">
              MCP Setup.
            </span>
          </h1>
          <p className="mt-3 text-[15px] sm:text-[16px] text-[#eaf4ff] leading-relaxed">
            Install the security audit skill and connect your editor to the cloud scanner over Streamable HTTP or SSE.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#070b14]/85 border border-white/15 text-[11.5px] font-mono text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>MCP Cloud Online · Streamable HTTP &amp; SSE</span>
          </div>
        </div>

        {/* Crisp High-Contrast Documentation Card on Sky Wash */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#cde3fa] shadow-[0_24px_64px_-16px_rgba(3,28,77,0.2)] p-6 sm:p-10 space-y-10">
          {/* Section 1: Skill Install */}
          <section className="space-y-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0558d6] text-white font-mono font-semibold text-[12px] shrink-0">
                1
              </span>
              <h2 className="font-display text-[20px] sm:text-[22px] font-semibold text-[#0f172a] tracking-tight">
                Install the Audit Skill (skills.sh)
              </h2>
            </div>
            <p className="text-[14px] text-[#475569] leading-relaxed">
              Run in your workspace root. It detects Cursor, Claude Code, Antigravity, or VS Code and installs the audit workflow and report script.
            </p>

            <div className="bg-[#070b14] border border-white/10 rounded-2xl overflow-hidden text-[#f8fafc]">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b1120] border-b border-white/10">
                <span className="text-[12px] font-mono text-[#94a3b8]">Terminal</span>
                <button
                  type="button"
                  onClick={() => copyCode('skill-cmd', SKILL_CMD)}
                  aria-label="Copy skill install command"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-[#cbd5e1] hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
                >
                  {copiedId === 'skill-cmd' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-300 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 font-mono text-[13px] sm:text-[13.5px] text-[#93c5fd] overflow-x-auto">
                <code translate="no">
                  <span className="text-[#64748b] mr-2 select-none font-bold">$</span>
                  {SKILL_CMD}
                </code>
              </div>
            </div>

            {/* Claude Code Native Plugin Install */}
            <div className="bg-[#070b14] border border-white/10 rounded-2xl overflow-hidden text-[#f8fafc]">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b1120] border-b border-white/10">
                <span className="text-[12px] font-mono text-[#94a3b8]">Claude Code Plugin</span>
                <button
                  type="button"
                  onClick={() => copyCode('claude-plugin-cmd', CLAUDE_PLUGIN_CMD)}
                  aria-label="Copy Claude Code plugin install commands"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-[#cbd5e1] hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
                >
                  {copiedId === 'claude-plugin-cmd' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-300 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 font-mono text-[13px] sm:text-[13.5px] text-[#93c5fd] overflow-x-auto space-y-1.5">
                <div>
                  <code translate="no">
                    <span className="text-[#64748b] mr-2 select-none font-bold">$</span>
                    claude plugin marketplace add MYSELF-SAYAN/knowyourdeps
                  </code>
                </div>
                <div>
                  <code translate="no">
                    <span className="text-[#64748b] mr-2 select-none font-bold">$</span>
                    claude plugin install knowyourdeps@knowyourdeps
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Connect KnowYourDeps MCP */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0558d6] text-white font-mono font-semibold text-[12px] shrink-0">
                2
              </span>
              <h2 className="font-display text-[20px] sm:text-[22px] font-semibold text-[#0f172a] tracking-tight">
                Connect Your Coding Agent
              </h2>
            </div>
            <p className="text-[14px] text-[#475569]">
              Paste this onboarding prompt into your coding agent, or expand client configs below.
            </p>

            {/* Primary Prompt Card */}
            <div className="bg-[#070b14] border border-white/10 rounded-2xl overflow-hidden text-white">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b1120] border-b border-white/10">
                <span className="text-[12px] font-mono text-[#94a3b8]">Agent onboarding prompt</span>
                <button
                  type="button"
                  onClick={() => copyCode('agent-prompt', AGENT_PROMPT)}
                  aria-label="Copy onboarding prompt"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-[#cbd5e1] hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
                >
                  {copiedId === 'agent-prompt' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-300 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 sm:p-5 font-mono text-[13px] leading-relaxed text-[#f1f5f9]">
                <span className="text-[#64748b] select-none font-bold mr-2">&gt;</span>
                <span>{AGENT_PROMPT}</span>
              </div>
            </div>

            {/* Collapsible Manual Setup */}
            <div className="pt-1">
              <button
                type="button"
                aria-expanded={isManualOpen}
                onClick={() => setIsManualOpen(!isManualOpen)}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors duration-150 cursor-pointer select-none py-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
              >
                {isManualOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#0558d6]" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
                )}
                <span>Manual MCP JSON configurations</span>
              </button>

              {isManualOpen && (
                <div className="mt-4 space-y-4 pl-2 sm:pl-4 border-l-2 border-[#bfdbfe]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {AGENTS.map((agent) => (
                      <div
                        key={agent.id}
                        className="bg-[#f8fbff] rounded-2xl border border-[#dce7f5] p-4 flex flex-col gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-semibold text-[13.5px] text-[#0f172a] truncate">
                              {agent.name}
                            </span>
                            <span
                              className="font-mono text-[10.5px] text-[#0558d6] bg-[#eff6ff] px-2 py-0.5 rounded-md border border-[#bfdbfe] font-semibold truncate max-w-[165px] shrink-0"
                              title={agent.file}
                              translate="no"
                            >
                              {agent.file}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#475569] mt-1 leading-snug">{agent.desc}</p>
                        </div>

                        <div className="bg-[#070b14] rounded-xl p-3 border border-white/10 text-[#f8fafc]">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-[#94a3b8]">
                            <span className="font-mono text-[10.5px]">JSON Config</span>
                            <button
                              type="button"
                              onClick={() => copyCode(agent.id, agent.config)}
                              aria-label={`Copy ${agent.name} JSON configuration`}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white text-[10.5px] transition-colors duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
                            >
                              {copiedId === agent.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                                  <span className="text-emerald-300 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" aria-hidden="true" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="font-mono text-[11px] text-[#93c5fd] whitespace-pre-wrap break-all leading-relaxed">
                            <code translate="no">{agent.config}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Prompts in Chat */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0558d6] text-white font-mono font-semibold text-[12px] shrink-0">
                3
              </span>
              <h2 className="font-display text-[20px] sm:text-[22px] font-semibold text-[#0f172a] tracking-tight">
                Example Agent Prompts
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-[12.5px]">
              <div className="p-4 rounded-2xl bg-[#f8fbff] border border-[#dce7f5] space-y-2">
                <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#0558d6]" aria-hidden="true" />
                  <span>Full Project Audit</span>
                </div>
                <p className="font-mono text-[11.5px] text-[#334155] bg-white p-2.5 rounded-xl border border-[#dce7f5]">
                  &quot;Audit all dependencies in this workspace and save Markdown &amp; CSV reports.&quot;
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fbff] border border-[#dce7f5] space-y-2">
                <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#0558d6]" aria-hidden="true" />
                  <span>Non-Breaking Upgrade</span>
                </div>
                <p className="font-mono text-[11.5px] text-[#334155] bg-white p-2.5 rounded-xl border border-[#dce7f5]">
                  &quot;Build a safe upgrade plan for express without breaking peer packages.&quot;
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fbff] border border-[#dce7f5] space-y-2">
                <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#0558d6]" aria-hidden="true" />
                  <span>Targeted Check</span>
                </div>
                <p className="font-mono text-[11.5px] text-[#334155] bg-white p-2.5 rounded-xl border border-[#dce7f5]">
                  &quot;Check requirements.txt for CVEs and verify upgrade impact before updating.&quot;
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Saved Deliverables */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0558d6] text-white font-mono font-semibold text-[12px] shrink-0">
                4
              </span>
              <h2 className="font-display text-[20px] sm:text-[22px] font-semibold text-[#0f172a] tracking-tight">
                Saved Deliverables
              </h2>
            </div>
            <p className="text-[14px] text-[#475569]">
              Generated reports overwrite stale snapshots cleanly inside your workspace{' '}
              <code className="font-mono text-[#0558d6] font-semibold bg-[#eff6ff] px-1.5 py-0.5 rounded border border-[#bfdbfe]">
                output/
              </code>{' '}
              directory:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[12.5px]">
              <div className="p-4 rounded-2xl bg-[#f8fbff] border border-[#dce7f5] flex items-start gap-3">
                <FileText className="h-4 w-4 text-[#0558d6] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-mono text-[12.5px] font-semibold text-[#0f172a]" translate="no">
                    output/vulnerability-report.md
                  </div>
                  <div className="text-[#475569] text-[12px] mt-1 leading-relaxed">
                    Executive summary, active CVSS advisories, co-upgrade steps, and verified alternatives.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fbff] border border-[#dce7f5] flex items-start gap-3">
                <TableIcon className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-mono text-[12.5px] font-semibold text-[#0f172a]" translate="no">
                    output/vulnerability-report.csv
                  </div>
                  <div className="text-[#475569] text-[12px] mt-1 leading-relaxed">
                    21-column UTF-8 BOM CSV spreadsheet for compliance tracking and audit reviews.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer onOpenCompare={openCompareModal} />

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
        <div className="min-h-screen flex items-center justify-center bg-[#eef7ff]">
          <div className="w-8 h-8 border-2 border-[#0558d6] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DocsContent />
    </Suspense>
  );
}
