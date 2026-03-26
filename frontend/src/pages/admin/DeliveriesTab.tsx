import { useEffect, useState } from 'react';
import { adminGetDeliveries } from '../../services/api.ts';
import type { Delivery } from '../../types/index.ts';
import { FolderOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function DeliveriesTab() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await adminGetDeliveries();
        setDeliveries(data);
      } catch {
        setError('Erreur chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-rs-black">Toutes les livraisons</h2>
        <span className="text-sm text-gray-500">{deliveries.length} livraison{deliveries.length > 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {deliveries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            Aucune livraison pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Journaliste</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Hebdo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Signes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Liens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-rs-black">
                      {d.author?.full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {d.paper_type?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-rs-black max-w-[200px] truncate">{d.title}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{d.hebdo?.label || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-mono ${
                        d.paper_type && d.sign_count > d.paper_type.sign_limit
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {d.sign_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {d.delivered_at
                        ? format(new Date(d.delivered_at), 'd MMM yyyy HH:mm', { locale: fr })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.drive_folder_url && (
                          <a
                            href={d.drive_folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-rs-red transition-colors"
                            title="Drive"
                          >
                            <FolderOpen size={16} />
                          </a>
                        )}
                        {d.digital_link && (
                          <a
                            href={d.digital_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Lien"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
