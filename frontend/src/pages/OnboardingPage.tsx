import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import {
  Newspaper,
  LayoutDashboard,
  Send,
  Pencil,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  ImageIcon,
  FileText,
  Sparkles,
  FolderOpen,
  ArrowRight,
  Check,
} from 'lucide-react';

const TOTAL_STEPS = 5;

function getOnboardingKey(userId: string) {
  return `rs-onboarding-done-${userId}`;
}

export function isOnboardingDone(userId: string): boolean {
  return localStorage.getItem(getOnboardingKey(userId)) === 'true';
}

function markOnboardingDone(userId: string) {
  localStorage.setItem(getOnboardingKey(userId), 'true');
}

/* ------------------------------------------------------------------ */
/*  Step components                                                    */
/* ------------------------------------------------------------------ */

function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <img
        src="/logo-rs-france.png"
        alt="Rolling Stone France"
        className="h-14 mb-8"
      />
      <h2 className="text-3xl font-bold text-rs-black mb-4">
        Bienvenue sur RS Hebdo Delivery
      </h2>
      <p className="text-gray-500 text-lg max-w-lg leading-relaxed">
        Cette plateforme vous permet de livrer vos papiers pour le magazine
        <span className="font-semibold text-rs-red"> Rolling Stone France</span>.
        En quelques clics, envoyez vos articles, photos et critiques directement
        a la redaction.
      </p>
      <div className="mt-10 flex items-center gap-3 text-sm text-gray-400">
        <Newspaper size={18} />
        <span>Rapide, simple et centralise</span>
      </div>
    </div>
  );
}

function StepDashboard() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="p-4 bg-rs-red/10 rounded-2xl mb-6">
        <LayoutDashboard size={36} className="text-rs-red" />
      </div>
      <h2 className="text-2xl font-bold text-rs-black mb-3">
        Votre tableau de bord
      </h2>
      <p className="text-gray-500 max-w-lg mb-8">
        Le dashboard affiche toutes vos livraisons et le numero d'hebdo en cours.
        Filtrez par numero pour retrouver facilement vos papiers.
      </p>

      {/* Mini mockup */}
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 overflow-hidden text-left shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-rs-black">Mes livraisons</span>
          <span className="text-xs px-2 py-0.5 bg-rs-red/10 text-rs-red rounded-full font-medium">
            Hebdo n.42
          </span>
        </div>
        {/* Row 1 */}
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">Critique</span>
            <span className="text-sm text-rs-black">Mon article rock</span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Livre</span>
        </div>
        {/* Row 2 */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">News</span>
            <span className="text-sm text-rs-black">Interview festival</span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">Corrige</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
        <ArrowRight size={12} />
        Utilisez le filtre pour naviguer entre les numeros
      </p>
    </div>
  );
}

function StepDeliver() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="p-4 bg-green-50 rounded-2xl mb-6">
        <Send size={36} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-rs-black mb-3">
        Livrer un papier
      </h2>
      <p className="text-gray-500 max-w-lg mb-8">
        La livraison se fait en 4 etapes simples :
      </p>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3 text-left">
        {[
          { icon: <FileText size={18} />, label: 'Choisissez le type de papier', color: 'bg-gray-100 text-gray-600' },
          { icon: <Pencil size={18} />, label: 'Remplissez le contenu et les champs', color: 'bg-blue-50 text-blue-600' },
          { icon: <Sparkles size={18} />, label: 'Correction automatique par IA', color: 'bg-purple-50 text-purple-600' },
          { icon: <Send size={18} />, label: 'Envoyez a la redaction !', color: 'bg-green-50 text-green-600' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className={`p-2 rounded-lg ${step.color}`}>{step.icon}</div>
            <span className="text-sm font-medium text-rs-black">{step.label}</span>
            <span className="ml-auto text-xs text-gray-300 font-semibold">{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-8 w-full max-w-sm space-y-2 text-left text-sm text-gray-500">
        <p className="flex items-start gap-2">
          <ImageIcon size={16} className="mt-0.5 text-gray-400 shrink-0" />
          Les champs avec une etoile (<span className="text-rs-red">*</span>) sont obligatoires
        </p>
        <p className="flex items-start gap-2">
          <Star size={16} className="mt-0.5 text-gray-400 shrink-0" />
          Chaque type de papier a une limite de signes a respecter
        </p>
        <p className="flex items-start gap-2">
          <StarHalf size={16} className="mt-0.5 text-yellow-500 shrink-0" />
          Etoiles : clic gauche = demi-etoile, clic droit = etoile entiere
        </p>
      </div>
    </div>
  );
}

function StepEdit() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="p-4 bg-blue-50 rounded-2xl mb-6">
        <Pencil size={36} className="text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-rs-black mb-3">
        Modifier un papier
      </h2>
      <p className="text-gray-500 max-w-lg mb-8">
        Vous pouvez modifier un papier deja soumis a tout moment en cliquant sur
        l'icone crayon dans votre liste de livraisons.
      </p>

      {/* Illustration */}
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 overflow-hidden text-left shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">Critique</span>
            <span className="text-sm text-rs-black">Mon article rock</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Livre</span>
            <div className="p-1.5 bg-rs-red/10 rounded-lg">
              <Pencil size={14} className="text-rs-red" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-sm space-y-2 text-left text-sm text-gray-500">
        <p className="flex items-start gap-2">
          <FolderOpen size={16} className="mt-0.5 text-gray-400 shrink-0" />
          Le document sera automatiquement mis a jour dans Dropbox
        </p>
        <p className="flex items-start gap-2">
          <Sparkles size={16} className="mt-0.5 text-gray-400 shrink-0" />
          La correction IA sera relancee sur le texte modifie
        </p>
      </div>
    </div>
  );
}

function StepReady({ skipChecked, onToggleSkip }: { skipChecked: boolean; onToggleSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="p-4 bg-rs-red/10 rounded-2xl mb-6">
        <Rocket size={36} className="text-rs-red" />
      </div>
      <h2 className="text-2xl font-bold text-rs-black mb-3">
        C'est parti !
      </h2>
      <p className="text-gray-500 max-w-lg mb-8">
        Vous etes pret a livrer votre premier papier pour Rolling Stone France.
        Bonne redaction !
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={skipChecked}
          onChange={onToggleSkip}
          className="w-4 h-4 rounded border-gray-300 text-rs-red focus:ring-rs-red accent-[#e40000]"
        />
        Ne plus afficher ce tutoriel
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress dots                                                      */
/* ------------------------------------------------------------------ */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          aria-label={`Etape ${i + 1}`}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-8 h-2.5 bg-rs-red'
              : i < current
                ? 'w-2.5 h-2.5 bg-rs-red/40'
                : 'w-2.5 h-2.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function OnboardingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skipChecked, setSkipChecked] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (target: number, dir: 'next' | 'prev') => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      // Let CSS transition play
      setTimeout(() => {
        setStep(target);
        setAnimating(false);
      }, 200);
    },
    [animating],
  );

  const next = () => {
    if (step < TOTAL_STEPS - 1) goTo(step + 1, 'next');
  };

  const prev = () => {
    if (step > 0) goTo(step - 1, 'prev');
  };

  const finish = () => {
    if (user && skipChecked) {
      markOnboardingDone(user.id);
    }
    navigate('/', { replace: true });
  };

  const isLast = step === TOTAL_STEPS - 1;

  const steps = [
    <StepWelcome key="welcome" />,
    <StepDashboard key="dashboard" />,
    <StepDeliver key="deliver" />,
    <StepEdit key="edit" />,
    <StepReady
      key="ready"
      skipChecked={skipChecked}
      onToggleSkip={() => setSkipChecked((v) => !v)}
    />,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-white to-gray-50">
      {/* Skip link */}
      <div className="flex justify-end p-4">
        <button
          onClick={finish}
          className="text-sm text-gray-400 hover:text-rs-red transition-colors"
        >
          Passer le tutoriel
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div
          className={`w-full max-w-xl transition-all duration-200 ease-in-out ${
            animating
              ? direction === 'next'
                ? 'opacity-0 translate-x-6'
                : 'opacity-0 -translate-x-6'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {steps[step]}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-100">
        <div className="max-w-xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Prev */}
          <button
            onClick={prev}
            disabled={step === 0}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              step === 0
                ? 'text-gray-200 cursor-default'
                : 'text-gray-500 hover:text-rs-black'
            }`}
          >
            <ChevronLeft size={18} />
            Precedent
          </button>

          {/* Dots */}
          <ProgressDots current={step} total={TOTAL_STEPS} />

          {/* Next / Finish */}
          {isLast ? (
            <button
              onClick={finish}
              className="flex items-center gap-1.5 px-5 py-2 bg-rs-red text-white text-sm font-semibold rounded-lg hover:bg-rs-red-dark transition-colors shadow-sm"
            >
              <Check size={16} />
              Commencer
            </button>
          ) : (
            <button
              onClick={next}
              className="flex items-center gap-1 text-sm font-medium text-rs-red hover:text-rs-red-dark transition-colors"
            >
              Suivant
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
