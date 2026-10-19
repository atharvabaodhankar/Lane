import React from 'react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="border-t-2 border-[#0E1B3D] bg-[#E6E9EE] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-sans uppercase text-[#0E1B3D]">Lane</span>
            <span className="text-xs font-mono text-[#0E1B3D]/70">— Bedrock Smart Cost Gateway</span>
          </div>
          <p className="text-xs font-mono text-[#0E1B3D]/60 mt-1">
            Open-source proxy powered by Fastino GLiDE & Amazon Bedrock Converse API.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono font-bold text-[#0E1B3D]">
          <button onClick={() => setActiveTab('home')} className="cursor-pointer hover:underline">
            Playground
          </button>
          <button onClick={() => setActiveTab('dashboard')} className="cursor-pointer hover:underline">
            Dashboard
          </button>
          <button onClick={() => setActiveTab('benchmark')} className="cursor-pointer hover:underline">
            Benchmark
          </button>
          <button onClick={() => setActiveTab('docs')} className="cursor-pointer hover:underline">
            Documentation
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer hover:underline text-[#2340FF]"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
