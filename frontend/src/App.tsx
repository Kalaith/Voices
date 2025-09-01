import React, { useState } from 'react';
import { VoiceLibraryPage } from './pages/VoiceLibraryPage';
import { ScriptManagerPage } from './pages/ScriptManagerPage';
import { VoiceGeneratorPage } from './pages/VoiceGeneratorPage';
import { VoiceTestingLabPage } from './pages/VoiceTestingLabPage';
import { Button } from './components/ui/Button';
import { TTSEngineSelector } from './components/TTSEngineSelector';

type TabType = 'voices' | 'scripts' | 'generator' | 'testing';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('voices');
  const [currentEngine, setCurrentEngine] = useState<string | null>(null);

  const tabs = [
    { id: 'voices' as TabType, label: 'Voice Library', icon: '🎤' },
    { id: 'testing' as TabType, label: 'Voice Testing Lab', icon: '🧪' },
    { id: 'scripts' as TabType, label: 'Script Manager', icon: '📝' },
    { id: 'generator' as TabType, label: 'Audio Generator', icon: '🎵' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <div className="flex justify-between items-start gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Voice Script Generator</h1>
              <p className="text-gray-600">Create custom voices, manage scripts, and generate audio</p>
            </div>
            <div className="flex-shrink-0 w-full max-w-xs">
              <TTSEngineSelector 
                onEngineChange={setCurrentEngine}
                className="w-full"
              />
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto" role="tablist">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 px-3 sm:px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap min-w-0 flex-shrink-0
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  ariaLabel={`Switch to ${tab.label} tab`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <span className="text-lg sm:text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </Button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <main className="tab-content" role="main">
          <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} className={activeTab === 'voices' ? '' : 'hidden'}>
            {activeTab === 'voices' && <VoiceLibraryPage />}
          </div>
          <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} className={activeTab === 'testing' ? '' : 'hidden'}>
            {activeTab === 'testing' && <VoiceTestingLabPage />}
          </div>
          <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} className={activeTab === 'scripts' ? '' : 'hidden'}>
            {activeTab === 'scripts' && <ScriptManagerPage />}
          </div>
          <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} className={activeTab === 'generator' ? '' : 'hidden'}>
            {activeTab === 'generator' && <VoiceGeneratorPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;