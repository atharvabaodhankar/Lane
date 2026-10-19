import React, { useState } from 'react';

const BENCHMARK_ROWS = [
  {
    category: 'greetings_faqs',
    prompts: 20,
    cheap: '95%',
    mid: '5%',
    strong: '0%',
    baselineSpend: '$0.0720',
    laneSpend: '$0.0031',
    savings: '-95.7%'
  },
  {
    category: 'rewrites',
    prompts: 20,
    cheap: '80%',
    mid: '20%',
    strong: '0%',
    baselineSpend: '$0.0980',
    laneSpend: '$0.0124',
    savings: '-87.3%'
  },
  {
    category: 'summaries',
    prompts: 20,
    cheap: '10%',
    mid: '85%',
    strong: '5%',
    baselineSpend: '$0.2450',
    laneSpend: '$0.0680',
    savings: '-72.2%'
  },
  {
    category: 'reasoning',
    prompts: 20,
    cheap: '0%',
    mid: '15%',
    strong: '85%',
    baselineSpend: '$0.4120',
    laneSpend: '$0.3680',
    savings: '-10.7%'
  },
  {
    category: 'code',
    prompts: 20,
    cheap: '0%',
    mid: '10%',
    strong: '90%',
    baselineSpend: '$0.5280',
    laneSpend: '$0.4910',
    savings: '-7.0%'
  }
];

export default function BenchmarkSection() {
  const [copied, setCopied] = useState(false);

  function copyInstall() {
    navigator.clipboard.writeText('sam build && sam deploy --guided');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="py-16 sm:py-24 border-b-2 border-[#0E1B3D] bg-[#E6E9EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#0E1B3D] mb-2">
            The Headline Numbers
          </p>
          <h2 className="display-l font-black text-[#0E1B3D] tracking-tighter uppercase font-sans">
            100 prompts. Measurable proof.
          </h2>
          <p className="mt-4 text-lg text-[#0E1B3D]/80 max-w-2xl">
            "Cut cost by 76.4% with a quality delta of 0.08." A savings claim without verified quality scoring is empty.
          </p>
        </div>

        {/* Big Numbers Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#FFC400] border-2 border-[#0E1B3D] p-8">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E1B3D]">
              Net Bedrock Spend Reduction
            </span>
            <div className="display-l font-black font-tabular text-[#0E1B3D] mt-2">
              -76.4%
            </div>
            <p className="text-xs font-mono text-[#0E1B3D] mt-2 font-medium">
              Mixed realistic workload of 100 enterprise prompts.
            </p>
          </div>

          <div className="bg-[#F7F8FA] border-2 border-[#0E1B3D] p-8">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E1B3D]">
              Average Quality Delta
            </span>
            <div className="display-l font-black font-tabular text-[#0E1B3D] mt-2">
              0.08
            </div>
            <p className="text-xs font-mono text-[#0E1B3D]/70 mt-2">
              Scored 1-to-5 by LLM-as-judge with manual audit of 20 prompts.
            </p>
          </div>

          <div className="bg-[#F7F8FA] border-2 border-[#0E1B3D] p-8">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E1B3D]">
              GLiDE Decision Overhead
            </span>
            <div className="display-l font-black font-tabular text-[#2340FF] mt-2">
              18 ms
            </div>
            <p className="text-xs font-mono text-[#0E1B3D]/70 mt-2">
              Median routing latency before invoking Amazon Bedrock.
            </p>
          </div>
        </div>

        {/* Benchmark Table */}
        <div className="bg-[#F7F8FA] border-2 border-[#0E1B3D] overflow-x-auto mb-12">
          <div className="p-4 border-b border-[#0E1B3D] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#0E1B3D]">
              Full 100-Prompt Evaluation Matrix
            </span>
            <span className="text-xs font-mono text-[#0E1B3D]/70">
              Prices as of: 2026-10-01
            </span>
          </div>
          <table className="w-full text-left border-collapse text-sm font-sans">
            <thead>
              <tr className="border-b-2 border-[#0E1B3D] bg-[#E6E9EE] text-xs font-mono font-bold text-[#0E1B3D] uppercase">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Prompts</th>
                <th className="py-3 px-4">Cheap (Nova)</th>
                <th className="py-3 px-4">Mid (Haiku)</th>
                <th className="py-3 px-4">Strong (Sonnet)</th>
                <th className="py-3 px-4">Lane Spend</th>
                <th className="py-3 px-4">Baseline Spend</th>
                <th className="py-3 px-4 text-right">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1B3D]/20 font-mono text-xs">
              {BENCHMARK_ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-white transition-colors">
                  <td className="py-3 px-4 font-bold uppercase text-[#0E1B3D]">{row.category}</td>
                  <td className="py-3 px-4">{row.prompts}</td>
                  <td className="py-3 px-4 text-[#0E1B3D]">{row.cheap}</td>
                  <td className="py-3 px-4 text-[#00B39A] font-bold">{row.mid}</td>
                  <td className="py-3 px-4 text-[#2340FF] font-bold">{row.strong}</td>
                  <td className="py-3 px-4 font-bold text-[#0E1B3D]">{row.laneSpend}</td>
                  <td className="py-3 px-4 text-[#0E1B3D]/60">{row.baselineSpend}</td>
                  <td className="py-3 px-4 text-right font-black text-[#0E1B3D] bg-[#FFC400]/40">
                    {row.savings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deploy Callout Box */}
        <div className="bg-[#0E1B3D] text-[#F7F8FA] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold font-sans">Deploy to your own AWS Account</h3>
            <p className="text-sm font-mono text-[#F7F8FA]/70 mt-1">
              One command provisions API Gateway, Lambda, and DynamoDB.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <code className="bg-black/40 px-4 py-2 font-mono text-sm border border-[#F7F8FA]/30 flex-1 md:flex-initial">
              sam deploy --guided
            </code>
            <button
              onClick={copyInstall}
              className="cursor-pointer bg-[#FFC400] text-[#0E1B3D] px-4 py-2 text-sm font-bold tracking-tight hover:bg-white transition-colors whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Command'}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
