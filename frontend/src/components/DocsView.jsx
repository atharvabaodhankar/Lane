import React, { useState } from 'react';

export default function DocsView() {
  const [copiedCode, setCopiedCode] = useState(false);

  const curlExample = `curl -X POST https://p9tjvqahg5.execute-api.ap-south-1.amazonaws.com/prod/api/v1/completions \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Summarize this in one line: Serverless architectures run code on demand." }
    ],
    "maxTokens": 512
  }'`;

  function copyCurl() {
    navigator.clipboard.writeText(curlExample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="border-b-2 border-[#0E1B3D] pb-6 mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-[#0E1B3D] mb-2 font-bold">
          Technical Reference · Active in ap-south-1 (Mumbai)
        </p>
        <h1 className="display-l font-black text-[#0E1B3D] tracking-tighter uppercase font-sans">
          Lane Documentation
        </h1>
        <p className="mt-4 text-lg text-[#0E1B3D]/80 leading-relaxed font-sans">
          An open-source intelligent proxy for Amazon Bedrock that routes every prompt to the cheapest model that can answer it using Fastino GLiDE.
        </p>
      </div>

      {/* 1. Quick Adoption */}
      <section className="mb-12">
        <h2 className="text-2xl font-black font-sans text-[#0E1B3D] uppercase tracking-tight mb-4">
          One-Line Adoption (Live Endpoint)
        </h2>
        <p className="text-sm font-sans text-[#0E1B3D]/80 leading-relaxed mb-4">
          Keep the rest of your app. Change the base URL to your deployed Lane API Gateway endpoint and send prompts to <code className="bg-white px-2 py-0.5 border border-[#0E1B3D] font-mono text-xs">/api/v1/completions</code>:
        </p>

        <div className="relative bg-[#0E1B3D] text-[#F7F8FA] p-4 border-2 border-[#0E1B3D] font-mono text-xs overflow-x-auto">
          <button
            onClick={copyCurl}
            className="absolute top-3 right-3 cursor-pointer bg-[#FFC400] text-[#0E1B3D] px-2.5 py-1 text-[11px] font-bold hover:bg-white transition-colors"
          >
            {copiedCode ? 'Copied!' : 'Copy'}
          </button>
          <pre>{curlExample}</pre>
        </div>
      </section>

      {/* 2. Model Lanes */}
      <section className="mb-12">
        <h2 className="text-2xl font-black font-sans text-[#0E1B3D] uppercase tracking-tight mb-4">
          Model Lanes & Pricing (ap-south-1)
        </h2>
        <p className="text-sm font-sans text-[#0E1B3D]/80 leading-relaxed mb-4">
          Model IDs and rates are configured in <code className="bg-white px-2 py-0.5 border border-[#0E1B3D] font-mono text-xs">backend/src/config/tiers.json</code>. Swapping a model is a configuration change, not a code rewrite.
        </p>

        <div className="bg-[#F7F8FA] border-2 border-[#0E1B3D] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#E6E9EE] border-b-2 border-[#0E1B3D] text-[#0E1B3D] font-bold uppercase">
                <th className="py-3 px-4">Lane</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Input / 1M</th>
                <th className="py-3 px-4">Output / 1M</th>
                <th className="py-3 px-4">Use Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0E1B3D]/20">
              <tr>
                <td className="py-3 px-4 font-bold text-[#0E1B3D] bg-[#FFC400]/20">cheap</td>
                <td className="py-3 px-4 font-bold">Amazon Nova Micro</td>
                <td className="py-3 px-4">$0.035</td>
                <td className="py-3 px-4">$0.14</td>
                <td className="py-3 px-4 text-[#0E1B3D]/80">Short Q&A, classifications, basic rewrites</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#0E1B3D] bg-[#00B39A]/20">mid</td>
                <td className="py-3 px-4 font-bold">Amazon Nova Lite</td>
                <td className="py-3 px-4">$0.060</td>
                <td className="py-3 px-4">$0.24</td>
                <td className="py-3 px-4 text-[#0E1B3D]/80">Conversational queries, RAG synthesis, summaries</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#0E1B3D] bg-[#2340FF]/20">strong</td>
                <td className="py-3 px-4 font-bold">DeepSeek V3.2</td>
                <td className="py-3 px-4">$0.550</td>
                <td className="py-3 px-4">$2.19</td>
                <td className="py-3 px-4 text-[#0E1B3D]/80">High-stakes reasoning, code generation, logic proofs</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-[#0E1B3D] bg-black/10">reject</td>
                <td className="py-3 px-4 font-bold">None (No Model Call)</td>
                <td className="py-3 px-4">$0.00</td>
                <td className="py-3 px-4">$0.00</td>
                <td className="py-3 px-4 text-[#0E1B3D]/80">PII leaks, prompt injections, malicious payloads</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Cost Formula */}
      <section className="mb-12">
        <h2 className="text-2xl font-black font-sans text-[#0E1B3D] uppercase tracking-tight mb-4">
          Cost Accounting Formula
        </h2>
        <div className="bg-[#F7F8FA] border-2 border-[#0E1B3D] p-6 space-y-3 font-mono text-xs">
          <div><strong className="text-[#0E1B3D]">actualCost</strong> = (inputTokens × tier.inputPer1M + outputTokens × tier.outputPer1M) / 1,000,000</div>
          <div><strong className="text-[#0E1B3D]">baselineCost</strong> = (inputTokens × baseline.inputPer1M + outputTokens × baseline.outputPer1M) / 1,000,000</div>
          <div><strong className="text-[#0E1B3D]">savings</strong> = baselineCost − actualCost</div>
          <div className="pt-2 text-[11px] text-[#0E1B3D]/70 border-t border-[#0E1B3D]/20">
            * Exact match cache hits record actualCost = $0.0000000 and count the full baseline as saved.
          </div>
        </div>
      </section>

      {/* 4. Deployment Instructions */}
      <section className="mb-12">
        <h2 className="text-2xl font-black font-sans text-[#0E1B3D] uppercase tracking-tight mb-4">
          Autonomous Deployment (AWS SAM)
        </h2>
        <p className="text-sm font-sans text-[#0E1B3D]/80 leading-relaxed mb-4">
          Deploy the complete serverless architecture into your AWS account with a single command:
        </p>
        <div className="bg-[#0E1B3D] text-[#F7F8FA] p-4 border-2 border-[#0E1B3D] font-mono text-xs mb-4">
          <pre>sam build -t infra/template.yaml{"\n"}sam deploy --stack-name lane-gateway --resolve-s3 --capabilities CAPABILITY_IAM</pre>
        </div>
      </section>

    </div>
  );
}
