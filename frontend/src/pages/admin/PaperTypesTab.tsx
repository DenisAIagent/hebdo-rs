import { useEffect, useState, type FormEvent } from 'react';
import {
  adminGetPaperTypes,
  adminCreatePaperType,
  adminUpdatePaperType,
  adminDeletePaperType,
} from '../../services/api.ts';
import type { PaperType } from '../../types/index.ts';
import { Plus, Pencil, Trash2, Save, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function PaperTypesTab() {
  const [types, setTypes] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [signLimit, setSignLimit] = useState('2500');
  const [driveFolderName, setDriveFolderName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const load = async () => {
    try {
      const data = await adminGetPaperTypes();
      setTypes(data);
    } catch {
      setError('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName('');
    setSignLimit('2500');
    setDriveFolderName('');
    setSortOrder('0');
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const startEdit = (pt: PaperType) => {
    setName(pt.name);
    setSignLimit(String(pt.sign_limit));
    setDriveFolderName(pt.drive_folder_name);
    setSortOrder(String(pt.sort_order));
    setEditingId(pt.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await adminUpdatePaperType(editingId, {
          name,
          sign_limit: parseInt(signLimit),
          drive_folder_name: driveFolderName,
          sort_order: parseInt(sortOrder),
        });
      } else {
        await adminCreatePaperType({
          name,
          sign_limit: parseInt(signLimit),
          drive_folder_name: driveFolderName || name,
          sort_order: parseInt(sortOrder),
        });
      }
      toast.success(editingId ? 'Type modifie' : 'Type cree');
      resetForm();
      await load();
    } catch {
      setError('Erreur sauvegarde');
      toast.error('Erreur sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Desactiver ce type de papier ?')) return;
    try {
      await adminDeletePaperType(id);
      toast.success('Type desactive');
      await load();
    } catch {
      setError('Erreur suppression');
      toast.error('Erreur suppression');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-rs-black">Types de papier</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 bg-rs-red hover:bg-rs-red-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rs-red focus:border-transparent"
                placeholder="Ex: Rolling Stone Interview"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Limite signes</label>
              <input
                type="number"
                value={signLimit}
                onChange={(e) => setSignLimit(e.target.value)}
                required
                min="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rs-red focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom dossier Drive</label>
              <input
                type="text"
                value={driveFolderName}
                onChange={(e) => setDriveFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rs-red focus:border-transparent"
                placeholder="Laissez vide pour utiliser le nom"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ordre</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rs-red focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="submit"
              className="flex items-center gap-1 bg-rs-red hover:bg-rs-red-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={14} />
              {editingId ? 'Modifier' : 'Creer'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Signes</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Dossier Drive</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actif</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {types.map((pt) => (
              <tr key={pt.id} className={`hover:bg-gray-50 ${!pt.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-rs-black">{pt.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{pt.sign_limit.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{pt.drive_folder_name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${pt.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => startEdit(pt)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    {pt.is_active && (
                      <button
                        onClick={() => handleDelete(pt.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Desactiver"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
