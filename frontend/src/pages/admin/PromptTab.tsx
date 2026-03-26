import { useEffect, useState } from 'react';
import { adminGetPrompt, adminUpdatePrompt } from '../../services/api.ts';
import { AlertTriangle, Save, RotateCcw, AlertCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function PromptTab() {
  const [promptText, setPromptText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const hasChanges = promptText !== originalText;

  const load = async () => {
    try {
      const data = await adminGetPrompt();
      setPromptText(data.prompt_text);
      setOriginalText(data.prompt_text);
      setUpdatedAt(data.updated_at);
    } catch {
      setError('Erreur chargement du prompt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setShowConfirm(false);
    setSaving(true);
    setError('');
    try {
      const data = await adminUpdatePrompt(promptText);
      setOriginalText(data.prompt_text);
      setUpdatedAt(data.updated_at);
      toast.success('Prompt mis a jour');
    } catch {
      setError('Erreur sauvegarde du prompt');
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPromptText(originalText);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-rs-black mb-4">Prompt de correction IA</h2>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-4">
        <ShieldAlert size={20} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Zone sensible</p>
          <p className="mt-1">
            Ce prompt controle le comportement de l'IA de correction. Une modification incorrecte peut
            <strong> casser completement la correction automatique</strong> des textes.
            Ne modifiez ce prompt que si vous savez exactement ce que vous faites.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Last updated info */}
      {updatedAt && (
        <p className="text-xs text-gray-400 mb-2">
          Derniere modification : {format(new Date(updatedAt), "d MMM yyyy 'a' HH:mm", { locale: fr })}
        </p>
      )}

      {/* Textarea */}
      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        rows={20}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono leading-relaxed focus:ring-2 focus:ring-rs-red focus:border-transparent resize-y"
        placeholder="Prompt de correction..."
      />

      {/* Character count */}
      <p className="text-xs text-gray-400 mt-1 mb-4">
        {promptText.length} caracteres
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 bg-rs-red hover:bg-rs-red-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Annuler les modifications
          </button>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-rs-black">Confirmer la modification</h3>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">
                Attention : cette action modifie le comportement de l'IA de correction pour TOUS les utilisateurs.
              </p>
              <p className="text-sm text-red-600 mt-1">
                Un prompt mal formule peut rendre la correction inutilisable.
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Etes-vous certain de vouloir appliquer ces modifications ? Assurez-vous d'avoir teste le nouveau prompt.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-rs-red hover:bg-rs-red-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <AlertTriangle size={14} />
                Oui, je sais ce que je fais
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
