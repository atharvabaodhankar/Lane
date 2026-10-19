import React from 'react';

const BEATS = [
  {
    step: '01',
    name: 'Prompt Ingestion',
    tech: 'API Gateway + Zod',
    desc: 'Incoming POST /api/v1/completions is validated and checked against the idempotency cache so retries never double-bill.',
    badge: 'Auth & Sanity'
  },
  {
    step: '02',
    name: 'Exact-Match Cache',
    tech: 'DynamoDB (TTL 86400s)',
    desc: 'Prompt is normalized and hashed via SHA-256. If answered previously, the cached answer returns instantly. Cost is zero.',
    badge: 'Zero-Cost'
  },
  {
    step: '03',
    name: 'Fastino GLiDE Decision',
    tech: 'Choice Primitive',
    desc: 'A small, fast decision model analyzes prompt complexity, length, and policy. If confidence is < 0.6, the prompt is safely bumped one tier.',
    badge: '< 20ms'
  },
  {
    step: '04',
    name: 'Bedrock Converse API',
    tech: 'Nova & Claude',
    desc: 'Bedrock is invoked with the chosen model. If cheap-lane returns an empty answer or refusal, it escalates once to mid.',
    badge: 'Single Retriable'
  }
];

export default function PromptJourney() {
  return (
    <section className="py-16 sm:py-24 border-b-2 border-[#0E1B3D] bg-[#E6E9EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#0E1B3D] mb-2">
            The Mechanics
          </p>
          <h2 className="display-l font-black text-[#0E1B3D] tracking-tighter uppercase font-sans">
            How a prompt travels.
          </h2>
          <p className="mt-4 text-lg text-[#0E1B3D]/80 max-w-2xl">
            Four disciplined beats between your application and Bedrock. Every decision is logged, verified, and audited.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BEATS.map((beat, i) => (
            <div
              key={i}
              className="bg-[#F7F8FA] border-2 border-[#0E1B3D] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#0E1B3D]/20 pb-3 mb-4">
                  <span className="text-2xl font-black font-mono text-[#0E1B3D]">{beat.step}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#0E1B3D] text-[#F7F8FA] font-bold">
                    {beat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-sans text-[#0E1B3D] mb-1">{beat.name}</h3>
                <div className="text-xs font-mono text-[#2340FF] font-semibold mb-3">{beat.tech}</div>
                <p className="text-sm font-sans text-[#0E1B3D]/80 leading-relaxed">{beat.desc}</p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#0E1B3D]/10 text-[11px] font-mono text-[#0E1B3D]/60 flex items-center justify-between">
                <span>Pass-through</span>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
