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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo-rs-france.png"
            alt="Rolling Stone France"
            className="h-14 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-rs-black">Hebdo Delivery</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-lg font-semibold text-rs-black mb-2">Email envoyé</h2>
              <p className="text-gray-500 text-sm mb-6">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-rs-red hover:underline"
              >
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-rs-black mb-2">Mot de passe oublié</h2>
              <p className="text-gray-500 text-sm mb-6">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="journaliste@rollingstone.fr"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rs-red hover:bg-rs-red-dark disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rs-red"
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
