import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Database,
  Brain,
  Cloud,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { postSetupConfigure } from '../services/api.ts';

const TOTAL_STEPS = 5;

function maskValue(val: string): string {
  if (!val) return '';
  if (val.length <= 4) return '\u2022'.repeat(8);
  return '\u2022'.repeat(8) + val.slice(-4);
}

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helpText?: string;
}

function PasswordInput({ id, label, value, onChange, placeholder, helpText }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-11 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm font-mono bg-white"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {helpText && (
        <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

function StepsIndicator({ current }: { current: number }) {
  const steps = [
    { num: 1, label: 'Bienvenue' },
    { num: 2, label: 'Base de donnees' },
    { num: 3, label: 'IA' },
    { num: 4, label: 'Dropbox' },
    { num: 5, label: 'Confirmation' },
  ];

  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                ${current === step.num
                  ? 'bg-rs-red text-white shadow-lg shadow-red-200'
                  : current > step.num
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {current > step.num ? <Check size={16} /> : step.num}
            </div>
            <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${current === step.num ? 'text-rs-red' : current > step.num ? 'text-green-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 mb-4 transition-colors duration-300 ${current > step.num ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function SetupPage({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [anthropicKey, setAnthropicKey] = useState('');
  const [dropboxAppKey, setDropboxAppKey] = useState('');
  const [dropboxAppSecret, setDropboxAppSecret] = useState('');
  const [dropboxRefreshToken, setDropboxRefreshToken] = useState('');

  const canProceed = (): boolean => {
    if (step === 3) return anthropicKey.trim().length > 0;
    if (step === 4) return dropboxAppKey.trim().length > 0 && dropboxAppSecret.trim().length > 0 && dropboxRefreshToken.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleFinalize = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await postSetupConfigure([
        { key: 'ANTHROPIC_API_KEY', value: anthropicKey.trim() },
        { key: 'DROPBOX_APP_KEY', value: dropboxAppKey.trim() },
        { key: 'DROPBOX_APP_SECRET', value: dropboxAppSecret.trim() },
        { key: 'DROPBOX_REFRESH_TOKEN', value: dropboxRefreshToken.trim() },
      ]);

      // Brief delay for visual feedback before redirect
      setTimeout(() => {
        onComplete();
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.error || 'Erreur lors de la configuration');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-8">
      {/* Subtle decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/logo-rs-france.png"
            alt="Rolling Stone France"
            className="h-12 mx-auto mb-3"
          />
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Hebdo Delivery</p>
        </div>

        {/* Steps indicator */}
        <StepsIndicator current={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* ── Step 1: Bienvenue ── */}
            {step === 1 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Sparkles size={28} className="text-rs-red" />
                </div>
                <h2 className="text-xl font-bold text-rs-black mb-3">
                  Configuration initiale
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Bienvenue dans RS Hebdo Delivery. Cet assistant va vous guider pour configurer les services essentiels de l'application.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 inline-flex items-center gap-2">
                  <AlertCircle size={16} />
                  Cette page n'apparaitra qu'une seule fois
                </div>
              </div>
            )}

            {/* ── Step 2: Base de donnees ── */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <Database size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-rs-black">Base de donnees</h2>
                    <p className="text-xs text-gray-500">Connexion Supabase</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Connexion active</p>
                      <p className="text-xs text-green-700 mt-1">
                        La connexion Supabase est configuree via les variables d'environnement du serveur
                        (<code className="bg-green-100 px-1 rounded text-[11px]">SUPABASE_URL</code>,{' '}
                        <code className="bg-green-100 px-1 rounded text-[11px]">SUPABASE_SERVICE_KEY</code>).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                  Si vous devez modifier ces valeurs, rendez-vous dans le dashboard Railway ou votre provider d'hebergement.
                </div>
              </div>
            )}

            {/* ── Step 3: Intelligence Artificielle ── */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Brain size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-rs-black">Intelligence Artificielle</h2>
                    <p className="text-xs text-gray-500">API Claude (Anthropic)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <PasswordInput
                    id="anthropic-key"
                    label="Cle API Anthropic"
                    value={anthropicKey}
                    onChange={setAnthropicKey}
                    placeholder="sk-ant-api03-..."
                    helpText="Utilisee pour la correction automatique des textes via Claude"
                  />

                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-rs-red hover:text-rs-red-dark transition-colors font-medium"
                  >
                    <ExternalLink size={12} />
                    Obtenir une cle API sur console.anthropic.com
                  </a>
                </div>
              </div>
            )}

            {/* ── Step 4: Stockage Dropbox ── */}
            {step === 4 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Cloud size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-rs-black">Stockage Dropbox</h2>
                    <p className="text-xs text-gray-500">Upload des documents et images</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <PasswordInput
                    id="dropbox-app-key"
                    label="App Key"
                    value={dropboxAppKey}
                    onChange={setDropboxAppKey}
                    placeholder="votre-app-key"
                    helpText="Identifiant de votre application Dropbox"
                  />

                  <PasswordInput
                    id="dropbox-app-secret"
                    label="App Secret"
                    value={dropboxAppSecret}
                    onChange={setDropboxAppSecret}
                    placeholder="votre-app-secret"
                  />

                  <PasswordInput
                    id="dropbox-refresh-token"
                    label="Refresh Token"
                    value={dropboxRefreshToken}
                    onChange={setDropboxRefreshToken}
                    placeholder="votre-refresh-token"
                    helpText="Token de longue duree pour l'acces aux fichiers"
                  />

                  <a
                    href="https://www.dropbox.com/developers/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-rs-red hover:text-rs-red-dark transition-colors font-medium"
                  >
                    <ExternalLink size={12} />
                    Creer une app sur developers.dropbox.com
                  </a>
                </div>
              </div>
            )}

            {/* ── Step 5: Confirmation ── */}
            {step === 5 && (
              <div>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-lg font-bold text-rs-black">Recapitulatif</h2>
                  <p className="text-xs text-gray-500 mt-1">Verifiez les informations avant de finaliser</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Database size={14} className="text-green-500" />
                      <span className="text-xs font-semibold text-gray-700">Supabase</span>
                    </div>
                    <p className="text-xs text-green-600 ml-5">Configure via variables d'environnement</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain size={14} className="text-purple-500" />
                      <span className="text-xs font-semibold text-gray-700">API Anthropic</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono ml-5">{maskValue(anthropicKey)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud size={14} className="text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700">Dropbox</span>
                    </div>
                    <div className="ml-5 space-y-0.5">
                      <p className="text-xs text-gray-500"><span className="text-gray-400">App Key:</span> <span className="font-mono">{maskValue(dropboxAppKey)}</span></p>
                      <p className="text-xs text-gray-500"><span className="text-gray-400">Secret:</span> <span className="font-mono">{maskValue(dropboxAppSecret)}</span></p>
                      <p className="text-xs text-gray-500"><span className="text-gray-400">Token:</span> <span className="font-mono">{maskValue(dropboxRefreshToken)}</span></p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-rs-black transition-colors font-medium disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Retour
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-1.5 bg-rs-red hover:bg-rs-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalize}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Configuration...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Finaliser la configuration
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-[11px] text-gray-400 mt-4">
          RS Hebdo Delivery -- Rolling Stone France
        </p>
      </div>
    </div>
  );
}
