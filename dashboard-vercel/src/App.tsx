import React, { useState } from 'react';
import { Overview } from './pages/Overview';
import { LinkedInPage } from './pages/LinkedInPage';
import { InstagramPage } from './pages/InstagramPage';
import { TikTokPage } from './pages/TikTokPage';
import { YouTubePage } from './pages/YouTubePage';
import { TopPostsPage } from './pages/TopPostsPage';
import { NarrativasPage } from './pages/NarrativasPage';
import { ComparativoPage } from './pages/ComparativoPage';

type View = 'overview' | 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'comparativo' | 'toposts' | 'narrativas';

export function App() {
  const [activeView, setActiveView] = useState<View>('overview');
  // Version: 2026-04-07-rebuild-trigger

  const navItems = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'linkedin' as const, label: 'LinkedIn' },
    { id: 'instagram' as const, label: 'Instagram' },
    { id: 'tiktok' as const, label: 'TikTok' },
    { id: 'youtube' as const, label: 'YouTube' },
    { id: 'comparativo' as const, label: 'Comparativo' },
    { id: 'toposts' as const, label: 'Top Posts' },
    { id: 'narrativas' as const, label: 'Narrativas' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeView === item.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {activeView === 'overview' && <Overview />}
        {activeView === 'linkedin' && <LinkedInPage />}
        {activeView === 'instagram' && <InstagramPage />}
        {activeView === 'tiktok' && <TikTokPage />}
        {activeView === 'youtube' && <YouTubePage />}
        {activeView === 'comparativo' && <ComparativoPage />}
        {activeView === 'toposts' && <TopPostsPage />}
        {activeView === 'narrativas' && <NarrativasPage />}
      </div>
    </div>
  );
}
