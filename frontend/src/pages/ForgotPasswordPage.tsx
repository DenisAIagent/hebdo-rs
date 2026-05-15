import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

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
          {sent ? (
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
                Email envoyé
              </div>
              <h2 className="serif" style={{ fontSize: 24, lineHeight: 1.1, marginBottom: 10 }}>
                Vérifiez votre boîte mail
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un
                lien de réinitialisation dans quelques instants.
              </p>
              <Link to="/login" className="rs-btn ghost">
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Mot de passe</div>
              <h2 className="serif" style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 6 }}>
                Mot de passe oublié ?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
                Entrez votre adresse email — nous vous enverrons un lien de
                réinitialisation.
              </p>

              {error && (
                <div className="rs-banner red flex items-center gap-2 mb-4">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="email"
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
                    Email
                  </label>
                  <div className="rs-input-wrap">
                    <span className="lead">
                      <Mail size={16} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="prenom@rollingstone.fr"
                      required
                      autoComplete="email"
                      className="rs-input with-icon"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rs-btn primary lg w-full"
                >
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>

              <div className="text-center" style={{ marginTop: 16 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1"
                  style={{ fontSize: 12, color: 'var(--muted)' }}
                >
                  <ArrowLeft size={14} />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
