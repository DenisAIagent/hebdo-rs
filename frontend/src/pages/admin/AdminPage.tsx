import { useState } from 'react';
import { PaperTypesTab } from './PaperTypesTab.tsx';
import { HebdoTab } from './HebdoTab.tsx';
import { JournalistsTab } from './JournalistsTab.tsx';
import { DeliveriesTab } from './DeliveriesTab.tsx';
import { PromptTab } from './PromptTab.tsx';
import { LogsTab } from './LogsTab.tsx';
import { SettingsTab } from './SettingsTab.tsx';
import { FileText, Hash, Users, Send, Bot, Activity, Settings } from 'lucide-react';

type Tab = 'paper-types' | 'hebdo' | 'journalists' | 'deliveries' | 'prompt' | 'logs' | 'settings';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('paper-types');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'paper-types', label: 'Types de papier', icon: <FileText size={18} /> },
    { key: 'hebdo', label: 'Hebdo', icon: <Hash size={18} /> },
    { key: 'journalists', label: 'Journalistes', icon: <Users size={18} /> },
    { key: 'deliveries', label: 'Livraisons', icon: <Send size={18} /> },
    { key: 'prompt', label: 'Prompt IA', icon: <Bot size={18} /> },
    { key: 'logs', label: 'Logs', icon: <Activity size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-rs-black mb-6">Administration</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              tab === t.key
                ? 'bg-white text-rs-black shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'paper-types' && <PaperTypesTab />}
      {tab === 'hebdo' && <HebdoTab />}
      {tab === 'journalists' && <JournalistsTab />}
      {tab === 'deliveries' && <DeliveriesTab />}
      {tab === 'prompt' && <PromptTab />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}
