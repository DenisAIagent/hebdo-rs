import { useEffect, useState, type FormEvent } from 'react';
import { adminGetHebdos, adminCreateHebdo, adminSetCurrentHebdo } from '../../services/api.ts';
import type { HebdoConfig } from '../../types/index.ts';
import { Plus, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function HebdoTab() {
  const [hebdos, setHebdos] = useState<HebdoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [numero, setNumero] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await adminGetHebdos();
      setHebdos(data);
    } catch {
      setError('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!numero) return;
    setError('');
    try {
      await adminCreateHebdo(parseInt(numero));
      toast.success(`Hebdo ${numero} cree et active`);
      setNumero('');
      await load();
    } catch {
      setError('Erreur creation');
      toast.error('Erreur creation');
    }
  };

  const handleSetCurrent = async (id: string) => {
    try {
      await adminSetCurrentHebdo(id);
      toast.success('Numero actif mis a jour');
      await load();
    } catch {
      setError('Erreur changement');
      toast.error('Erreur changement');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-rs-black mb-4">Gestion des numeros Hebdo</h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex items-end gap-3 mb-6">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau numero</label>
          <input
            type="number"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex: 227"
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rs-red focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1 bg-rs-red hover:bg-rs-red-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Creer et activer
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Label</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Numero</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Cree le</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">En cours</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hebdos.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-rs-black">{h.label}</td>
                <td className="px-4 py-3 text-center text-gray-600">{h.numero}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {format(new Date(h.created_at), 'd MMM yyyy', { locale: fr })}
                </td>
                <td className="px-4 py-3 text-center">
                  {h.is_current ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      <Check size={12} />
                      Actif
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!h.is_current && (
                    <button
                      onClick={() => handleSetCurrent(h.id)}
                      className="text-xs text-rs-red hover:underline font-medium"
                    >
                      Activer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
