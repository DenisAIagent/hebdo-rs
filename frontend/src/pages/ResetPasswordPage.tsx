import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--paper)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 mx-auto mb-3"
            style={{ borderColor: 'var(--rs-red)', borderTopColor: 'transparent' }}
          />
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Vérification du lien…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper)' }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo-rs-france.png" alt="Rolling Stone France" className="h-12 mb-3" />
          <span className="serif italic" style={{ fontSize: 18, color: 'var(--ink)' }}>
            Hebdo<span style={{ color: 'var(--rs-red)' }}>·</span>Delivery
          </span>
        </div>

        <div className="rs-card thick" style={{ padding: 32 }}>
          {success ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center mb-4"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--ok-tint)',
                  color: 'var(--ok)',
                }}
              >
                <CheckCircle size={32} />
              </div>
              <div className="eyebrow" style={{ color: 'var(--ok)', marginBottom: 6 }}>
                Mot de passe modifié
              </div>
              <h2 className="serif" style={{ fontSize: 24, lineHeight: 1.1, marginBottom: 10 }}>
                C'est fait.
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Redirection vers le tableau de bord…
              </p>
            </div>
          ) : (
            <>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Sécurité</div>
              <h2 className="serif" style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 6 }}>
                Nouveau mot de passe
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
                Choisissez un nouveau mot de passe sécurisé.
              </p>

              {error && (
                <div className="rs-banner red flex items-center gap-2 mb-4">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--ink-2)',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Nouveau mot de passe
                    </label>
                    <div className="rs-input-wrap">
                      <span className="lead">
                        <Lock size={16} />
                      </span>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 caractères"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="rs-input with-icon"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm"
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--ink-2)',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Confirmer
                    </label>
                    <div className="rs-input-wrap">
                      <span className="lead">
                        <Lock size={16} />
                      </span>
                      <input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Retapez le mot de passe"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="rs-input with-icon"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rs-btn primary lg w-full"
                  style={{ marginTop: 22 }}
                >
                  {loading ? 'Modification…' : 'Modifier le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
