import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import { getMyDeliveries, getAllHebdos } from '../services/api.ts';
import type { Delivery, HebdoConfig } from '../types/index.ts';
import { Send, FileText, Clock, ExternalLink, FolderOpen, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Only allow http/https URLs to prevent javascript: injection */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [hebdos, setHebdos] = useState<HebdoConfig[]>([]);
  const [selectedHebdoId, setSelectedHebdoId] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [d, allHebdos] = await Promise.all([getMyDeliveries(), getAllHebdos()]);
        setDeliveries(d);
        setHebdos(allHebdos);
        // Pre-select current hebdo
        const current = allHebdos.find((h) => h.is_current);
        if (current) setSelectedHebdoId(current.id);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rs-red border-t-transparent" />
      </div>
    );
  }

  const selectedHebdo = hebdos.find((h) => h.id === selectedHebdoId);
  const filteredDeliveries = selectedHebdoId === 'all'
    ? deliveries
    : deliveries.filter((d) => d.hebdo_id === selectedHebdoId);

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-rs-black">
            Bonjour, {user?.full_name}
          </h1>
          {selectedHebdo && (
            <p className="text-gray-500 mt-1">
              Numero selectionne : <span className="font-semibold text-rs-red">{selectedHebdo.label}</span> (n&deg;{selectedHebdo.numero})
            </p>
          )}
        </div>
        {/* Hebdo filter */}
        {hebdos.length > 0 && (
          <div className="relative">
            <select
              value={selectedHebdoId}
              onChange={(e) => setSelectedHebdoId(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-rs-black focus:ring-2 focus:ring-rs-red focus:border-transparent cursor-pointer"
            >
              <option value="all">Tous les numeros</option>
              {hebdos.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label} (n&deg;{h.numero}) {h.is_current ? '- en cours' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rs-red/10 rounded-lg">
              <Send size={20} className="text-rs-red" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rs-black">{filteredDeliveries.length}</p>
              <p className="text-sm text-gray-500">
                {selectedHebdoId === 'all' ? 'Livraisons totales' : `Livraisons ${selectedHebdo?.label || ''}`}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rs-black">{deliveries.length}</p>
              <p className="text-sm text-gray-500">Livraisons totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Link to="/livrer" className="flex items-center gap-3 group">
            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Send size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-green-700 group-hover:underline">Livrer un papier</p>
              <p className="text-xs text-gray-500">Nouveau papier</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Deliveries list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-rs-black">Mes livraisons</h2>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>Aucune livraison {selectedHebdo ? `pour ${selectedHebdo.label}` : 'pour le moment'}</p>
            <Link to="/livrer" className="text-rs-red text-sm font-medium hover:underline mt-2 inline-block">
              Livrer un papier
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDeliveries.map((d) => (
              <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {d.paper_type?.name || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {d.hebdo?.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-rs-black truncate">{d.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {d.delivered_at
                        ? format(new Date(d.delivered_at), "d MMM yyyy 'a' HH:mm", { locale: fr })
                        : format(new Date(d.created_at), "d MMM yyyy", { locale: fr })}
                    </span>
                    <span className="text-xs text-gray-400">{d.sign_count} signes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    d.status === 'delivered'
                      ? 'bg-green-50 text-green-700'
                      : d.status === 'corrected'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-50 text-gray-600'
                  }`}>
                    {d.status === 'delivered' ? 'Livre' : d.status === 'corrected' ? 'Corrige' : 'Brouillon'}
                  </span>
                  {d.drive_folder_url && isSafeUrl(d.drive_folder_url) && (
                    <a
                      href={d.drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-rs-red transition-colors"
                      title="Voir dans Dropbox"
                    >
                      <FolderOpen size={16} />
                    </a>
                  )}
                  {d.digital_link && isSafeUrl(d.digital_link) && (
                    <a
                      href={d.digital_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Lien numerique"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
