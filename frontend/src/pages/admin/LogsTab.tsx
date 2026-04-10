import { useEffect, useState } from 'react';
import { adminGetLogs } from '../../services/api.ts';
import type { DeliveryLog } from '../../types/index.ts';
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw, Filter } from 'lucide-react';

const LEVEL_CONFIG = {
  error: {
    icon: <AlertCircle size={14} />,
    badge: 'bg-red-100 text-red-700',
    row: 'bg-red-50 border-l-4 border-l-red-500',
    label: 'Erreur',
  },
  warn: {
    icon: <AlertTriangle size={14} />,
    badge: 'bg-amber-100 text-amber-700',
    row: 'bg-amber-50 border-l-4 border-l-amber-400',
    label: 'Attention',
  },
  info: {
    icon: <CheckCircle size={14} />,
    badge: 'bg-green-100 text-green-700',
    row: 'border-l-4 border-l-gray-200',
    label: 'Info',
  },
};

const STEP_LABELS: Record<string, string> = {
  'start': 'Demarrage',
  'validation': 'Validation',
  'docx': 'DOCX',
  'dropbox-auth': 'Auth Dropbox',
  'dropbox-folders': 'Dossiers Dropbox',
  'dropbox-upload': 'Upload Dropbox',
  'dropbox-link': 'Lien Dropbox',
  'database': 'Base de donnees',
  'email': 'Email',
  'success': 'OK',
};

export function LogsTab() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const level = filter === 'all' ? undefined : filter;
      const data = await adminGetLogs(level);
      setLogs(data);
    } catch (err) {
      console.error('Load logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateFull = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
              <AlertCircle size={14} />
              {errorCount} erreur{errorCount > 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
              <AlertTriangle size={14} />
              {warnCount} alerte{warnCount > 1 ? 's' : ''}
            </span>
          )}
          {errorCount === 0 && warnCount === 0 && !loading && (
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
              <CheckCircle size={14} />
              Tout va bien
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <Filter size={14} className="text-gray-400 ml-2" />
            {[
              { key: 'all', label: 'Tous' },
              { key: 'error', label: 'Erreurs' },
              { key: 'warn', label: 'Alertes' },
              { key: 'info', label: 'Info' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filter === f.key
                    ? 'bg-white text-rs-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rs-black transition-colors px-3 py-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Rafraichir
          </button>
        </div>
      </div>

      {/* Logs list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-rs-red border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          Aucun log {filter !== 'all' ? `de type "${filter}"` : ''} pour le moment.
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const cfg = LEVEL_CONFIG[log.level];
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className={`rounded-lg p-3 ${cfg.row}`}>
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  {/* Level badge */}
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>

                  {/* Step */}
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
                    {STEP_LABELS[log.step] || log.step}
                  </span>

                  {/* Message */}
                  <span className="text-sm text-gray-800 flex-1 font-medium">
                    {log.message}
                  </span>

                  {/* Meta */}
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 ml-[72px] space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {log.journalist_name && (
                        <div>
                          <span className="text-gray-400">Journaliste : </span>
                          <span className="text-gray-700 font-medium">{log.journalist_name}</span>
                        </div>
                      )}
                      {log.hebdo_label && (
                        <div>
                          <span className="text-gray-400">Hebdo : </span>
                          <span className="text-gray-700 font-medium">{log.hebdo_label}</span>
                        </div>
                      )}
                      {log.paper_type_name && (
                        <div>
                          <span className="text-gray-400">Type : </span>
                          <span className="text-gray-700 font-medium">{log.paper_type_name}</span>
                        </div>
                      )}
                      {log.title && (
                        <div>
                          <span className="text-gray-400">Titre : </span>
                          <span className="text-gray-700 font-medium">{log.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDateFull(log.created_at)}
                    </div>
                    {log.detail && (
                      <pre className="text-xs bg-gray-900 text-gray-200 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap">
                        {log.detail}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
