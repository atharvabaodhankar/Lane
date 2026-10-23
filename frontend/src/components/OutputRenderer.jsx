import React, { useState } from 'react';
import { Copy, Check, Terminal, Sparkles, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { formatCost } from '../lib/currency';

/**
 * Intelligent parser that converts raw LLM text into formatted markdown blocks
 * (Code blocks, bullet points, headers, paragraphs)
 */
function parseContent(rawText) {
  if (!rawText) return [];

  const blocks = [];
  const lines = rawText.split('\n');
  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer = [];
  let textBuffer = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      blocks.push({
        type: 'text',
        content: textBuffer.join('\n').trim()
      });
      textBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        flushText();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim() || 'code';
        codeBuffer = [];
      } else {
        // End code block
        blocks.push({
          type: 'code',
          lang: codeLang,
          code: codeBuffer.join('\n')
        });
        inCodeBlock = false;
        codeLang = '';
        codeBuffer = [];
      }
    } else if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({ type: 'code', lang: codeLang || 'code', code: codeBuffer.join('\n') });
  } else {
    flushText();
  }

  return blocks;
}

/**
 * Sleek Code Block Component with header, syntax aesthetic, and Copy button
 */
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 border-2 border-[#0E1B3D] bg-[#0E1B3D] text-[#F7F8FA] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#142654] border-b border-white/10 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-white/80">
          <Terminal size={12} className="text-[#FFC400]" />
          <span className="uppercase font-bold tracking-wider">{lang}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-[#FFC400] hover:text-[#0E1B3D] text-white text-[10px] font-bold transition-colors cursor-pointer"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto leading-relaxed text-[#E6E9EE]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Text paragraph renderer that handles headers, bullets, and bold text
 */
function TextBlock({ content }) {
  if (!content) return null;

  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-2 text-sm text-[#0E1B3D] leading-relaxed">
      {paragraphs.map((para, idx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Check for header
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={idx} className="font-black text-sm uppercase tracking-wide text-[#0E1B3D] pt-1">
              {trimmed.replace(/^###\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('##')) {
          return (
            <h3 key={idx} className="font-black text-base uppercase tracking-wide text-[#0E1B3D] pt-1">
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          );
        }

        // Check for bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
          const listItems = trimmed.split('\n');
          return (
            <ul key={idx} className="space-y-1.5 my-1.5 pl-1">
              {listItems.map((item, iIdx) => {
                const isNumbered = /^\d+\.\s/.test(item.trim());
                const cleanItem = item.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
                return (
                  <li key={iIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                    {isNumbered ? (
                      <span className="font-mono font-bold text-[11px] bg-[#0E1B3D] text-white px-1.5 py-0.2 rounded-none shrink-0">
                        {iIdx + 1}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2340FF] shrink-0 mt-2" />
                    )}
                    <span className="flex-1">{cleanItem}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line text-xs sm:text-sm font-sans">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function OutputRenderer({ result, loading }) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const blocks = parseContent(result?.answer || '');

  const laneTheme = {
    cheap: { bg: 'bg-[#FFC400]', text: 'text-[#0E1B3D]', border: 'border-[#FFC400]', name: 'CHEAP LANE' },
    mid: { bg: 'bg-[#00B39A]', text: 'text-white', border: 'border-[#00B39A]', name: 'MID LANE' },
    strong: { bg: 'bg-[#2340FF]', text: 'text-white', border: 'border-[#2340FF]', name: 'STRONG LANE' },
    reject: { bg: 'bg-[#D32F2F]', text: 'text-white', border: 'border-[#D32F2F]', name: 'REJECT' }
  }[result?.lane || 'cheap'];

  return (
    <div className="mt-4 bg-white border-2 border-[#0E1B3D] shadow-[3px_3px_0px_#0E1B3D] transition-all">
      {/* Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#E6E9EE] border-b-2 border-[#0E1B3D]">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider ${laneTheme.bg} ${laneTheme.text}`}>
            {laneTheme.name}
          </span>
          <span className="text-xs font-mono font-bold text-[#0E1B3D] truncate max-w-[200px] sm:max-w-xs">
            {result?.modelName || result?.modelId}
          </span>
          {result?.cacheHit && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-[#00B39A] text-white px-2 py-0.5">
              <Zap size={10} /> CACHE HIT (₹0.00)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {result?.latencyMs && (
            <span className="text-[11px] font-mono text-[#0E1B3D]/70 font-medium">
              ⏱ {result.latencyMs}ms
            </span>
          )}
          {result?.cost && (
            <span className="text-[11px] font-mono font-bold text-[#0E1B3D] bg-white px-1.5 py-0.5 border border-[#0E1B3D]">
              {formatCost(result.cost)}
            </span>
          )}
          <button
            onClick={handleCopyAll}
            type="button"
            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#FFC400] text-[#0E1B3D] text-[11px] font-mono font-bold border border-[#0E1B3D] transition-colors cursor-pointer"
            title="Copy full output"
          >
            {copiedAll ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedAll ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Output Content Area */}
      <div className="p-4 max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#0E1B3D]">
              <Sparkles size={14} className="animate-spin text-[#2340FF]" />
              Routing via Fastino GLiDE & Invoking Bedrock...
            </div>
            <div className="w-48 h-1.5 bg-[#E6E9EE] overflow-hidden border border-[#0E1B3D]">
              <div className="h-full bg-[#2340FF] animate-pulse w-3/4" />
            </div>
          </div>
        ) : blocks.length === 0 ? (
          <p className="text-xs font-mono text-[#0E1B3D]/60 italic">No output generated yet.</p>
        ) : (
          <div>
            {blocks.map((block, idx) => (
              <React.Fragment key={idx}>
                {block.type === 'code' ? (
                  <CodeBlock lang={block.lang} code={block.code} />
                ) : (
                  <TextBlock content={block.content} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Footer Audit Bar */}
      <div className="px-3 py-1.5 bg-[#F7F8FA] border-t border-[#0E1B3D]/20 flex flex-wrap items-center justify-between text-[10px] font-mono text-[#0E1B3D]/70">
        <span>Verified by Amazon Bedrock Converse API</span>
        {result?.decision?.confidence && (
          <span>Decision Confidence: {(result.decision.confidence * 100).toFixed(1)}%</span>
        )}
      </div>
    </div>
  );
}
