import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Playground from './components/Playground';
import PromptJourney from './components/PromptJourney';
import BenchmarkSection from './components/BenchmarkSection';
import DashboardView from './components/DashboardView';
import DocsView from './components/DocsView';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen flex flex-col bg-[#E6E9EE] text-[#0E1B3D]">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Playground />
            <PromptJourney />
            <BenchmarkSection />
          </>
        )}

        {activeTab === 'dashboard' && <DashboardView />}

        {activeTab === 'benchmark' && <BenchmarkSection />}

        {activeTab === 'docs' && <DocsView />}
      </main>

      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
