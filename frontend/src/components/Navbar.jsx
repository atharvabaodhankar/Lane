import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="border-b-2 border-[#0E1B3D] bg-[#E6E9EE] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            {/* Visual Lane Road Mark */}
            <div className="flex flex-col gap-1 w-7 py-1">
              <div className="h-1 bg-[#FFC400] w-full" />
              <div className="h-1 bg-[#00B39A] w-full" />
              <div className="h-1 bg-[#2340FF] w-full" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0E1B3D] font-sans">
              Lane
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold tracking-wide">
            <button
              onClick={() => setActiveTab('home')}
              className={`cursor-pointer transition-colors ${
                activeTab === 'home'
                  ? 'text-[#2340FF] underline decoration-2 underline-offset-8'
                  : 'text-[#0E1B3D] hover:text-[#2340FF]'
              }`}
            >
              Playground
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`cursor-pointer transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-[#2340FF] underline decoration-2 underline-offset-8'
                  : 'text-[#0E1B3D] hover:text-[#2340FF]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`cursor-pointer transition-colors ${
                activeTab === 'benchmark'
                  ? 'text-[#2340FF] underline decoration-2 underline-offset-8'
                  : 'text-[#0E1B3D] hover:text-[#2340FF]'
              }`}
            >
              Benchmark
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`cursor-pointer transition-colors ${
                activeTab === 'docs'
                  ? 'text-[#2340FF] underline decoration-2 underline-offset-8'
                  : 'text-[#0E1B3D] hover:text-[#2340FF]'
              }`}
            >
              Documentation
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-[#0E1B3D] bg-[#F7F8FA] text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00B39A] animate-pulse" />
            <span>Bedrock Gateway: Online</span>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer bg-[#2340FF] text-[#F7F8FA] px-4 py-2 text-sm font-bold tracking-tight hover:bg-[#0E1B3D] transition-colors"
          >
            Open Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}
