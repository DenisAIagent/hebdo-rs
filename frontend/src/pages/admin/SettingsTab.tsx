import { useEffect, useState } from 'react';
import { adminGetSettings, adminUpdateSettings } from '../../services/api.ts';
import type { AppSetting } from '../../types/index.ts';
import { Key, Eye, EyeOff, Save, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingField {
  key: string;
  label: string;
  description: string;
}

interface SettingSection {
  title: string;
  icon: React.ReactNode;
  fields: SettingField[];
}

const SECTIONS: SettingSection[] = [
  {
    title: 'API Claude (Anthropic)',
    icon: <Key size={18} className="text-purple-600" />,
    fields: [
      {
        key: 'ANTHROPIC_API_KEY',
        label: 'Cle API Anthropic',
        description: 'Cle utilisee pour la correction automatique des textes via Claude.',
      },
    ],
  },
  {
    title: 'Dropbox',
    icon: <Key size={18} className="text-blue-600" />,
    fields: [
      {
        key: 'DROPBOX_APP_KEY',
        label: 'App Key',
        description: 'Identifiant de l\'application Dropbox.',
      },
      {
        key: 'DROPBOX_APP_SECRET',
        label: 'App Secret',
        description: 'Secret de l\'application Dropbox.',
      },
      {
        key: 'DROPBOX_REFRESH_TOKEN',
        label: 'Refresh Token',
        description: 'Token de rafraichissement pour l\'acces Dropbox.',
      },
    ],
  },
];

export function SettingsTab() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track which fields are being edited (key -> new value)
  const [editing, setEditing] = useState<Record<string, string>>({});
  // Track which fields have visible values
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  // Track saving state per section
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      const data = await adminGetSettings();
      setSettings(data);
    } catch {
      setError('Erreur chargement des settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getSettingValue = (key: string): string => {
    const s = settings.find((s) => s.key === key);
    return s?.value || '';
  };

  const isEditing = (key: string): boolean => key in editing;

  const startEditing = (key: string) => {
    setEditing((prev) => ({ ...prev, [key]: '' }));
  };

  const cancelEditing = (key: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleVisibility = (key: string) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSection = async (section: SettingSection) => {
    const sectionKeys = section.fields.map((f) => f.key);
    const toUpdate = sectionKeys
      .filter((key) => key in editing && editing[key].trim() !== '')
      .map((key) => ({ key, value: editing[key] }));

    if (toUpdate.length === 0) {
      toast.error('Aucune modification a enregistrer');
      return;
    }

    setSaving((prev) => ({ ...prev, [section.title]: true }));
    try {
      await adminUpdateSettings(toUpdate);
      toast.success('Settings mis a jour');
      // Clear editing state for saved keys
      setEditing((prev) => {
        const next = { ...prev };
        for (const key of toUpdate.map((u) => u.key)) {
          delete next[key];
        }
        return next;
      });
      // Reload to get masked values
      await load();
    } catch {
      toast.error('Erreur mise a jour');
    } finally {
      setSaving((prev) => ({ ...prev, [section.title]: false }));
    }
  };

  const sectionHasEdits = (section: SettingSection): boolean => {
    return section.fields.some((f) => f.key in editing && editing[f.key].trim() !== '');
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-rs-black mb-4">Parametres et cles API</h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
              {section.icon}
              <h3 className="font-semibold text-rs-black">{section.title}</h3>
            </div>

            {/* Fields */}
            <div className="divide-y divide-gray-100">
              {section.fields.map((field) => {
                const maskedValue = getSettingValue(field.key);
                const isFieldEditing = isEditing(field.key);
                const isVisible = visible[field.key] || false;

                return (
                  <div key={field.key} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-rs-black mb-0.5">
                          {field.label}
                        </label>
                        <p className="text-xs text-gray-500 mb-3">{field.description}</p>

                        {isFieldEditing ? (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type={isVisible ? 'text' : 'password'}
                                value={editing[field.key]}
                                onChange={(e) =>
                                  setEditing((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                placeholder="Entrer la nouvelle valeur..."
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-rs-red focus:border-transparent"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => toggleVisibility(field.key)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <button
                              onClick={() => cancelEditing(field.key)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono truncate">
                              {maskedValue || <span className="text-gray-300 italic">Non configure</span>}
                            </code>
                            <button
                              onClick={() => startEditing(field.key)}
                              className="text-xs text-rs-red hover:underline font-medium px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              Modifier
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save button */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => handleSaveSection(section)}
                disabled={!sectionHasEdits(section) || saving[section.title]}
                className="flex items-center gap-1.5 bg-rs-red hover:bg-rs-red-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving[section.title] ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
