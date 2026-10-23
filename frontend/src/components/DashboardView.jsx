import React, { useState, useEffect } from 'react';
import { fetchStats, fetchRequests } from '../lib/apiClient';
import { formatCost } from '../lib/currency';

export default function DashboardView() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, r] = await Promise.all([fetchStats(), fetchRequests()]);
      setStats(s);
      setRequests(r);
      setLoading(false);
    }
    load();
  }, []);

  if (loading && !stats) {
    return (
      <div className="py-24 text-center">
        <span className="font-mono text-sm uppercase text-[#0E1B3D]">Loading dashboard metrics...</span>
      </div>
    );
  }

  // Calculate percentages for lane split safely
  const actualTotal =
    (stats.laneSplit?.cheap || 0) +
    (stats.laneSplit?.mid || 0) +
    (stats.laneSplit?.strong || 0) +
    (stats.laneSplit?.reject || 0);

  const cheapPct = actualTotal > 0 ? Math.round(((stats.laneSplit.cheap || 0) / actualTotal) * 100) : 0;
  const midPct = actualTotal > 0 ? Math.round(((stats.laneSplit.mid || 0) / actualTotal) * 100) : 0;
  const strongPct = actualTotal > 0 ? Math.round(((stats.laneSplit.strong || 0) / actualTotal) * 100) : 0;
  const rejectPct = actualTotal > 0 ? Math.max(0, 100 - cheapPct - midPct - strongPct) : 0;

  return (
    <div className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Top Banner: Saved This Period (INR) */}
      <div className="mb-10 bg-[#F7F8FA] border-2 border-[#0E1B3D] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#0E1B3D] font-bold">
                Saved This Period
              </span>
              <span className="text-xs font-mono font-bold bg-[#FFC400] text-[#0E1B3D] px-2 py-0.5 border border-[#0E1B3D]">
                ₹ INR (~95/USD)
              </span>
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black font-tabular text-[#0E1B3D] tracking-tight break-all">
              {formatCost(stats.totalSavings)}
            </div>
            <div className="text-sm font-mono text-[#0E1B3D]/70 mt-2">
              of <span className="font-bold text-[#0E1B3D]">{formatCost(stats.totalBaselineCost)}</span> always-strong baseline ({stats.savingsPercent} net reduction)
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#0E1B3D]/20 pt-4 md:pt-0 md:pl-8">
            <div>
              <div className="text-xs font-mono text-[#0E1B3D]/60 uppercase">Total Prompts</div>
              <div className="text-2xl font-black font-tabular text-[#0E1B3D]">{stats.totalRequests}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-[#0E1B3D]/60 uppercase">Cache Hits (Free)</div>
              <div className="text-2xl font-black font-tabular text-[#00B39A]">{stats.cacheHits}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-[#0E1B3D]/60 uppercase">Prices As Of</div>
              <div className="text-xs font-mono font-bold text-[#0E1B3D]">{stats.pricesAsOf}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hand-Crafted Spend Over Time SVG Chart */}
      <div className="mb-12 bg-[#F7F8FA] border-2 border-[#0E1B3D] p-8">
        <div className="flex items-center justify-between border-b border-[#0E1B3D]/20 pb-4 mb-6">
          <div>
            <h3 className="text-xl font-black font-sans uppercase tracking-tight text-[#0E1B3D]">
              Spend Over Time
            </h3>
            <p className="text-xs font-mono text-[#0E1B3D]/70 mt-1">
              Thin ink line: Baseline (always-strong) · Thick signal line: Actual · Yellow gap: Direct savings
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#2340FF]" /> Actual Spend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0E1B3D]" /> Baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#FFC400] border border-[#0E1B3D]" /> Savings Gap
            </span>
          </div>
        </div>

        {/* Hand-built SVG chart */}
        <div className="w-full h-64 bg-[#E6E9EE] border border-[#0E1B3D] p-2">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="40" y1="40" x2="780" y2="40" stroke="#0E1B3D" strokeOpacity="0.1" strokeDasharray="4 4" />
            <line x1="40" y1="90" x2="780" y2="90" stroke="#0E1B3D" strokeOpacity="0.1" strokeDasharray="4 4" />
            <line x1="40" y1="140" x2="780" y2="140" stroke="#0E1B3D" strokeOpacity="0.1" strokeDasharray="4 4" />

            {/* Gap polygon filled in paint yellow (#FFC400) */}
            <polygon
              points="40,50 140,55 240,48 340,62 440,45 540,58 640,42 740,38 740,165 640,168 540,172 440,166 340,174 240,169 140,173 40,170"
              fill="#FFC400"
              stroke="#0E1B3D"
              strokeWidth="1"
            />

            {/* Baseline Spend Line (thin ink #0E1B3D line) */}
            <polyline
              points="40,50 140,55 240,48 340,62 440,45 540,58 640,42 740,38"
              fill="none"
              stroke="#0E1B3D"
              strokeWidth="2"
            />

            {/* Actual Spend Line (thick signal #2340FF line) */}
            <polyline
              points="40,170 140,173 240,169 340,174 440,166 540,172 640,168 740,165"
              fill="none"
              stroke="#2340FF"
              strokeWidth="4"
            />

            {/* Day labels on X axis */}
            <text x="40" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Mon</text>
            <text x="140" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Tue</text>
            <text x="240" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Wed</text>
            <text x="340" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Thu</text>
            <text x="440" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Fri</text>
            <text x="540" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Sat</text>
            <text x="640" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Sun</text>
            <text x="740" y="192" fill="#0E1B3D" fontSize="10" fontFamily="monospace">Today</text>
          </svg>
        </div>
      </div>

      {/* Stacked Lane Split Bar */}
      <div className="mb-12 bg-[#F7F8FA] border-2 border-[#0E1B3D] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black font-sans uppercase tracking-tight text-[#0E1B3D]">
            Traffic Split by Lane
          </h3>
          <span className="text-xs font-mono text-[#0E1B3D]/70 font-bold">
            {stats.totalRequests} total evaluated requests
          </span>
        </div>

        {/* Stacked Bar with inline labels or empty state */}
        {actualTotal === 0 ? (
          <div className="w-full h-12 flex items-center justify-center bg-[#E6E9EE] border-2 border-[#0E1B3D] text-xs font-mono font-medium text-[#0E1B3D]/70">
            Awaiting incoming prompts to generate traffic breakdown...
          </div>
        ) : (
          <div className="w-full h-12 flex border-2 border-[#0E1B3D] overflow-hidden text-xs font-mono font-bold">
            {cheapPct > 0 && (
              <div
                style={{ width: `${cheapPct}%` }}
                className="bg-[#FFC400] text-[#0E1B3D] flex items-center justify-center px-2 truncate border-r border-[#0E1B3D]"
              >
                Cheap: {cheapPct}%
              </div>
            )}
            {midPct > 0 && (
              <div
                style={{ width: `${midPct}%` }}
                className="bg-[#00B39A] text-[#0E1B3D] flex items-center justify-center px-2 truncate border-r border-[#0E1B3D]"
              >
                Mid: {midPct}%
              </div>
            )}
            {strongPct > 0 && (
              <div
                style={{ width: `${strongPct}%` }}
                className="bg-[#2340FF] text-white flex items-center justify-center px-2 truncate border-r border-[#0E1B3D]"
              >
                Strong: {strongPct}%
              </div>
            )}
            {rejectPct > 0 && (
              <div
                style={{ width: `${rejectPct}%` }}
                className="bg-[#0E1B3D] text-[#F7F8FA] flex items-center justify-center px-2 truncate"
              >
                Reject: {rejectPct}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Request History Table */}
      <div className="bg-[#F7F8FA] border-2 border-[#0E1B3D] overflow-x-auto">
        <div className="p-4 border-b border-[#0E1B3D] flex items-center justify-between">
          <h3 className="text-lg font-black font-sans uppercase text-[#0E1B3D]">
            Recent Request Log
          </h3>
          <span className="text-xs font-mono text-[#0E1B3D]/70 font-bold">
            Values in ₹ INR · Click row to inspect GLiDE decision
          </span>
        </div>

        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b-2 border-[#0E1B3D] bg-[#E6E9EE] uppercase font-bold text-[#0E1B3D]">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Lane</th>
              <th className="py-3 px-4">Model</th>
              <th className="py-3 px-4">Cost (₹)</th>
              <th className="py-3 px-4">Saved (₹)</th>
              <th className="py-3 px-4">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0E1B3D]/10">
            {requests.map((r) => {
              const isExpanded = expandedId === r.id;
              const laneColors = {
                cheap: 'bg-[#FFC400] text-[#0E1B3D]',
                mid: 'bg-[#00B39A] text-[#0E1B3D]',
                strong: 'bg-[#2340FF] text-white',
                reject: 'bg-[#0E1B3D] text-[#F7F8FA]'
              };

              return (
                <React.Fragment key={r.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="cursor-pointer hover:bg-white transition-colors"
                  >
                    <td className="py-3 px-4 text-[#0E1B3D]/70">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 font-bold uppercase ${laneColors[r.lane] || 'bg-gray-200'}`}>
                        {r.lane}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0E1B3D] truncate max-w-xs">{r.modelId}</td>
                    <td className="py-3 px-4 font-tabular font-bold">{formatCost(r.cost)}</td>
                    <td className="py-3 px-4 font-tabular text-[#00B39A] font-bold">
                      {parseFloat(r.savings) > 0 ? `+${formatCost(r.savings)}` : '₹0.0000'}
                    </td>
                    <td className="py-3 px-4 text-[#0E1B3D]/70">{r.latencyMs} ms</td>
                  </tr>

                  {/* Expandable Details Row */}
                  {isExpanded && (
                    <tr className="bg-white border-y-2 border-[#0E1B3D]">
                      <td colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] uppercase text-[#0E1B3D]/60 font-bold block mb-1">
                              Prompt Preview
                            </span>
                            <div className="p-3 bg-[#E6E9EE] text-[#0E1B3D] text-xs font-sans">
                              {r.promptPreview || 'No preview stored.'}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#0E1B3D]/60 font-bold block mb-1">
                              GLiDE Decision Reasoning
                            </span>
                            <div className="p-3 bg-[#E6E9EE] text-[#0E1B3D] text-xs font-mono">
                              {r.reason || 'Evaluated via model routing rules.'}
                              <div className="mt-2 text-[10px] text-[#0E1B3D]/60 flex gap-4">
                                <span>Tokens in: {r.inputTokens}</span>
                                <span>Tokens out: {r.outputTokens}</span>
                                <span>Cache hit: {r.cacheHit ? 'YES' : 'NO'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
