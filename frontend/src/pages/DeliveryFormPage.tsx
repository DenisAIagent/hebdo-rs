import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  getActivePaperTypes,
  getAllHebdos,
  ensureHebdo,
  correctText,
  submitDelivery,
} from '../services/api.ts';
import type { PaperType, HebdoConfig, CorrectionResult } from '../types/index.ts';
import {
  ChevronRight,
  ChevronLeft,
  Image,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'type' | 'content' | 'correction' | 'review';

export function DeliveryFormPage() {
  const navigate = useNavigate();

  // Data
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [hebdos, setHebdos] = useState<HebdoConfig[]>([]);
  const [selectedHebdo, setSelectedHebdo] = useState<HebdoConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Hebdo input
  const [numeroInput, setNumeroInput] = useState('');
  const [loadingHebdo, setLoadingHebdo] = useState(false);
  const [hebdoError, setHebdoError] = useState('');

  // Form
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<PaperType | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyOriginal, setBodyOriginal] = useState('');
  const [digitalLink, setDigitalLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Correction
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState<CorrectionResult | null>(null);
  const [bodyCorrected, setBodyCorrected] = useState('');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [pt, allHebdos] = await Promise.all([getActivePaperTypes(), getAllHebdos()]);
        setPaperTypes(pt);
        setHebdos(allHebdos);
        // Pre-select the current hebdo if one exists
        const current = allHebdos.find((h) => h.is_current);
        if (current) {
          setSelectedHebdo(current);
          setNumeroInput(String(current.numero));
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Image drop
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // Sign count
  const signCount = bodyCorrected.length || bodyOriginal.length;
  const signLimit = selectedType?.sign_limit || 0;
  const signOverLimit = signLimit > 0 && signCount > signLimit;

  // Correction
  const handleCorrection = async () => {
    if (!bodyOriginal.trim()) return;
    setCorrecting(true);
    try {
      const result = await correctText(bodyOriginal);
      setCorrection(result);
      setBodyCorrected(result.correctedText);
      setStep('correction');
    } catch (err) {
      console.error('Correction error:', err);
      toast.error('Correction automatique indisponible — texte original conserve');
      // If correction fails, use original text
      setBodyCorrected(bodyOriginal);
      setStep('correction');
    } finally {
      setCorrecting(false);
    }
  };

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedHebdo || !imageFile) return;

    setSubmitting(true);
    setSubmitError('');

    const formData = new FormData();
    formData.append('paper_type_id', selectedType.id);
    formData.append('hebdo_id', selectedHebdo.id);
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('body_original', bodyOriginal);
    formData.append('body_corrected', bodyCorrected || bodyOriginal);
    formData.append('digital_link', digitalLink);
    formData.append('image', imageFile);

    try {
      const result = await submitDelivery(formData);
      setDriveUrl(result.drive.folderUrl);
      setSubmitSuccess(true);
    } catch (err: unknown) {
      console.error('Submit error:', err);
      const msg = err instanceof Error ? err.message : 'Erreur lors de la livraison';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rs-red border-t-transparent" />
      </div>
    );
  }

  // Handle hebdo number validation
  const handleValidateNumero = async () => {
    const num = parseInt(numeroInput, 10);
    if (!num || num < 1 || num > 9999) {
      setHebdoError('Numero invalide (entre 1 et 9999)');
      return;
    }
    setLoadingHebdo(true);
    setHebdoError('');
    try {
      const hebdo = await ensureHebdo(num);
      setSelectedHebdo(hebdo);
      // Refresh the hebdos list if this is a new one
      if (!hebdos.find((h) => h.id === hebdo.id)) {
        setHebdos((prev) => [hebdo, ...prev]);
      }
    } catch (err) {
      console.error('Ensure hebdo error:', err);
      setHebdoError('Erreur lors de la creation du numero');
    } finally {
      setLoadingHebdo(false);
    }
  };

  // Success screen
  if (submitSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-rs-black mb-2">Papier livre !</h1>
        <p className="text-gray-500 mb-6">
          Votre papier <strong>{title}</strong> a bien ete envoye dans Dropbox.
          L'equipe a ete notifiee par email.
        </p>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors mb-4"
          >
            <FileText size={18} />
            Voir dans Dropbox
          </a>
        )}
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-rs-red transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // Steps
  const steps: { key: Step; label: string }[] = [
    { key: 'type', label: 'Type' },
    { key: 'content', label: 'Contenu' },
    { key: 'correction', label: 'Correction' },
    { key: 'review', label: 'Envoi' },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-rs-black">Livrer un papier</h1>
        {selectedHebdo && (
          <p className="text-gray-500 text-sm mt-1">
            {selectedHebdo.label} — Numero {selectedHebdo.numero}
          </p>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                i <= stepIndex
                  ? 'bg-rs-red text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i <= stepIndex ? 'text-rs-black font-medium' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${i < stepIndex ? 'bg-rs-red' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Hebdo Number + Paper Type */}
      {step === 'type' && (
        <div className="space-y-6">
          {/* Hebdo number input */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-rs-black mb-2">Numero d'hebdo</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tapez le numero sur lequel vous travaillez. S'il n'existe pas encore, il sera cree automatiquement.
            </p>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">RSH</span>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={numeroInput}
                  onChange={(e) => {
                    setNumeroInput(e.target.value);
                    setHebdoError('');
                    // Clear selection if number changes
                    if (selectedHebdo && String(selectedHebdo.numero) !== e.target.value) {
                      setSelectedHebdo(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleValidateNumero();
                    }
                  }}
                  placeholder="226"
                  className="w-full pl-14 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-lg font-bold text-rs-black"
                />
              </div>
              <button
                onClick={handleValidateNumero}
                disabled={!numeroInput || loadingHebdo}
                className="flex items-center gap-2 bg-rs-red hover:bg-rs-red-dark disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {loadingHebdo ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Valider
              </button>
            </div>

            {hebdoError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle size={14} />
                {hebdoError}
              </p>
            )}

            {selectedHebdo && (
              <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-lg">
                <CheckCircle size={14} />
                {selectedHebdo.label} selectionne
              </div>
            )}

            {/* Quick suggestions from recent hebdos */}
            {hebdos.length > 0 && !selectedHebdo && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Numeros recents :</p>
                <div className="flex flex-wrap gap-2">
                  {hebdos.slice(0, 6).map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setNumeroInput(String(h.numero));
                        setSelectedHebdo(h);
                        setHebdoError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-rs-red/10 hover:text-rs-red text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      {h.label}
                      {h.is_current && (
                        <span className="text-[10px] bg-rs-red/10 text-rs-red px-1.5 py-0.5 rounded-full">
                          en cours
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Paper type selector — only visible once hebdo is confirmed */}
          {selectedHebdo && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-rs-black mb-4">Type de papier</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paperTypes.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => {
                      setSelectedType(pt);
                      setStep('content');
                    }}
                    className={`text-left p-4 rounded-lg border-2 transition-all hover:border-rs-red hover:shadow-sm ${
                      selectedType?.id === pt.id
                        ? 'border-rs-red bg-rs-red/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <p className="font-medium text-rs-black">{pt.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Limite : {pt.sign_limit.toLocaleString()} signes
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Content */}
      {step === 'content' && selectedType && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-rs-black">Contenu du papier</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {selectedType.name}
              </span>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre <span className="text-rs-red">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de votre papier"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet / Artiste
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Nom de l'artiste ou sujet"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Corps du texte <span className="text-rs-red">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      signOverLimit
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {bodyOriginal.length.toLocaleString()} / {selectedType.sign_limit.toLocaleString()} signes
                  </span>
                </div>
                <textarea
                  value={bodyOriginal}
                  onChange={(e) => setBodyOriginal(e.target.value)}
                  placeholder="Collez ou saisissez votre texte ici..."
                  rows={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm leading-relaxed resize-y"
                  required
                />
                {signOverLimit && (
                  <p className="text-xs text-red-600 mt-1">
                    Depassement de {(bodyOriginal.length - selectedType.sign_limit).toLocaleString()} signes
                  </p>
                )}
              </div>

              {/* Digital Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lien numerique
                </label>
                <input
                  type="url"
                  value={digitalLink}
                  onChange={(e) => setDigitalLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image <span className="text-rs-red">*</span>
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-rs-red text-white rounded-full p-1 hover:bg-rs-red-dark transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1">{imageFile?.name}</p>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-rs-red bg-rs-red/5'
                        : 'border-gray-300 hover:border-rs-red'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Image size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Glissez une image ici ou <span className="text-rs-red font-medium">cliquez pour choisir</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — Max 10 Mo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('type')}
              className="flex items-center gap-1 text-gray-500 hover:text-rs-black text-sm font-medium transition-colors"
            >
              <ChevronLeft size={18} />
              Type de papier
            </button>
            <button
              onClick={handleCorrection}
              disabled={!title || !bodyOriginal || !imageFile || correcting}
              className="flex items-center gap-2 bg-rs-red hover:bg-rs-red-dark disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {correcting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Correction en cours...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Corriger le texte
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Correction review */}
      {step === 'correction' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-rs-black mb-4">Texte corrige</h2>

            {correction && correction.corrections.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  {correction.corrections.length} correction{correction.corrections.length > 1 ? 's' : ''} trouvee{correction.corrections.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {correction.corrections.map((c, i) => (
                    <div key={i} className="text-xs">
                      <span className="line-through text-red-600">{c.original}</span>
                      {' → '}
                      <span className="text-green-700 font-medium">{c.corrected}</span>
                      <span className="text-gray-500 ml-2">({c.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Texte final (modifiable)
              </label>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  signOverLimit ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {bodyCorrected.length.toLocaleString()} / {selectedType?.sign_limit.toLocaleString()} signes
              </span>
            </div>
            <textarea
              value={bodyCorrected}
              onChange={(e) => setBodyCorrected(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm leading-relaxed resize-y"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('content')}
              className="flex items-center gap-1 text-gray-500 hover:text-rs-black text-sm font-medium transition-colors"
            >
              <ChevronLeft size={18} />
              Modifier le contenu
            </button>
            <button
              onClick={() => setStep('review')}
              className="flex items-center gap-2 bg-rs-red hover:bg-rs-red-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Verifier et envoyer
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 'review' && selectedType && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-rs-black mb-4">Recapitulatif</h2>

            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Type</dt>
                <dd className="text-sm font-medium text-rs-black">{selectedType.name}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Hebdo</dt>
                <dd className="text-sm font-medium text-rs-black">{selectedHebdo?.label}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Titre</dt>
                <dd className="text-sm font-medium text-rs-black">{title}</dd>
              </div>
              {subject && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500">Sujet</dt>
                  <dd className="text-sm font-medium text-rs-black">{subject}</dd>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Signes</dt>
                <dd className={`text-sm font-medium ${signOverLimit ? 'text-red-600' : 'text-rs-black'}`}>
                  {signCount.toLocaleString()} / {signLimit.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Image</dt>
                <dd className="text-sm font-medium text-rs-black">{imageFile?.name}</dd>
              </div>
              {digitalLink && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500">Lien</dt>
                  <dd className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{digitalLink}</dd>
                </div>
              )}
            </dl>

            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('correction')}
              className="flex items-center gap-1 text-gray-500 hover:text-rs-black text-sm font-medium transition-colors"
            >
              <ChevronLeft size={18} />
              Texte corrige
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Livrer le papier
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
