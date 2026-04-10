import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  getActivePaperTypes,
  getNextHebdo,
  prepareHebdo,
  correctText,
  submitDelivery,
  getDelivery,
  updateDelivery,
  adminGetDelivery,
  adminUpdateDelivery,
} from '../services/api.ts';
import type { PaperType, HebdoConfig, CorrectionResult, Delivery } from '../types/index.ts';
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
  Star,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

type Step = 'type' | 'content' | 'correction' | 'review';

export function DeliveryFormPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isAdminEdit = searchParams.get('admin') === 'true';
  const isEditMode = !!editId;

  // Data
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [nextHebdo, setNextHebdo] = useState<HebdoConfig | null>(null);
  const [hebdoConfirmed, setHebdoConfirmed] = useState(false);
  const [preparingFolders, setPreparingFolders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editDelivery, setEditDelivery] = useState<Delivery | null>(null);

  // Form
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<PaperType | null>(null);

  // Dynamic fields stored in metadata
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  // Multiple images support
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
        const [pt, hebdo] = await Promise.all([getActivePaperTypes(), getNextHebdo()]);
        setPaperTypes(pt);
        setNextHebdo(hebdo);

        // Edit mode: load existing delivery and pre-fill form
        if (editId) {
          const delivery = isAdminEdit ? await adminGetDelivery(editId) : await getDelivery(editId);
          setEditDelivery(delivery);

          // Find and set the paper type
          const paperType = pt.find(p => p.id === delivery.paper_type_id) || delivery.paper_type as unknown as PaperType;
          if (paperType) {
            setSelectedType(paperType);
          }

          // Set hebdo
          if (delivery.hebdo) {
            setNextHebdo({
              id: delivery.hebdo_id,
              numero: delivery.hebdo.numero,
              label: delivery.hebdo.label,
              start_date: null,
              end_date: null,
              is_current: true,
              created_at: '',
            });
          }

          // Pre-fill metadata
          setMetadata(delivery.metadata || {});

          // Pre-fill corrected body if available
          if (delivery.body_corrected) {
            setBodyCorrected(delivery.body_corrected);
          }

          // In edit mode, skip to content step directly
          setHebdoConfirmed(true);
          setStep('content');
        }
      } catch (err) {
        console.error('Load error:', err);
        if (editId) {
          toast.error('Impossible de charger la livraison');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [editId]);

  // Confirm hebdo selection and trigger Dropbox folder creation
  const handleConfirmHebdo = async () => {
    if (!nextHebdo) return;
    setPreparingFolders(true);
    try {
      await prepareHebdo(nextHebdo.id);
      setHebdoConfirmed(true);
    } catch (err) {
      console.error('Prepare hebdo error:', err);
      toast.error('Erreur preparation des dossiers Dropbox');
    } finally {
      setPreparingFolders(false);
    }
  };

  // Image drop - now supports multiple files
  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      rejected.forEach((r: any) => {
        const errors = r.errors?.map((e: any) => e.message).join(', ') || 'Fichier refuse';
        toast.error(`${r.file?.name}: ${errors}`);
      });
    }
    if (accepted.length > 0) {
      // Add new files to existing ones
      setImageFiles(prev => [...prev, ...accepted]);

      // Create previews for new files
      accepted.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.tiff', '.tif', '.bmp', '.avif'] },
    maxFiles: 20,
    maxSize: 25 * 1024 * 1024,
  });

  // Remove a specific image
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Update metadata field
  const updateMetadata = (key: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get the body field key (usually 'corps')
  const getBodyFieldKey = () => {
    if (!selectedType?.fields_config) return null;
    const bodyField = selectedType.fields_config.find(f => f.key === 'corps');
    return bodyField ? 'corps' : null;
  };

  // Sign count
  const bodyFieldKey = getBodyFieldKey();
  const bodyText = bodyCorrected || (bodyFieldKey ? metadata[bodyFieldKey] || '' : '');
  const signCount = bodyText.length;
  const signLimit = selectedType?.sign_limit || 0;
  const signOverLimit = signLimit > 0 && signCount > signLimit;

  // Correction
  const handleCorrection = async () => {
    const bodyFieldKey = getBodyFieldKey();
    if (!bodyFieldKey || !metadata[bodyFieldKey]?.trim()) return;

    setCorrecting(true);
    try {
      const result = await correctText(metadata[bodyFieldKey]);
      setCorrection(result);
      setBodyCorrected(result.correctedText);
      setStep('correction');
    } catch (err) {
      console.error('Correction error:', err);
      toast.error('Correction automatique indisponible — texte original conserve');
      // If correction fails, use original text
      setBodyCorrected(metadata[bodyFieldKey]);
      setStep('correction');
    } finally {
      setCorrecting(false);
    }
  };

  // Get title from metadata
  const getTitle = () => {
    if (!selectedType) return '';

    // For Sujet de couv and Interview 3000: use artiste
    if (selectedType.name === 'Sujet de couv' || selectedType.name === 'Interview 3000') {
      return metadata.artiste || '';
    }
    // For Disque de la semaine: use album or artiste
    if (selectedType.name === 'Disque de la semaine') {
      return metadata.album || metadata.artiste || '';
    }
    // For Chroniques: use artiste
    if (selectedType.name === 'Chroniques') {
      return metadata.artiste || '';
    }
    // Fallback: use first text field
    const firstTextField = selectedType.fields_config.find(f => f.type === 'text');
    return firstTextField ? metadata[firstTextField.key] || '' : '';
  };

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedType || !nextHebdo) return;

    setSubmitting(true);
    setSubmitError('');

    const formData = new FormData();
    formData.append('paper_type_id', selectedType.id);
    formData.append('hebdo_id', nextHebdo.id);

    // Add metadata with corrected body if available
    const finalMetadata = { ...metadata };
    if (bodyCorrected && bodyFieldKey) {
      finalMetadata[bodyFieldKey] = bodyCorrected;
    }
    formData.append('metadata', JSON.stringify(finalMetadata));

    // Add title derived from metadata
    const title = getTitle();
    formData.append('title', title);

    // Add all images
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      if (isAdminEdit && editId) {
        // Admin edit: simple metadata update (no Dropbox re-upload)
        const finalMeta = { ...metadata };
        if (bodyCorrected && bodyFieldKey) {
          finalMeta[bodyFieldKey] = bodyCorrected;
        }
        await adminUpdateDelivery(editId, finalMeta, getTitle());
        setSubmitSuccess(true);
      } else if (isEditMode && editId) {
        const result = await updateDelivery(editId, formData);
        setDriveUrl(result.drive.folderUrl);
        setSubmitSuccess(true);
      } else {
        const result = await submitDelivery(formData);
        setDriveUrl(result.drive.folderUrl);
        setSubmitSuccess(true);
      }
    } catch (err: unknown) {
      console.error('Submit error:', err);
      const msg = err instanceof Error ? err.message : 'Erreur lors de la modification';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Validation: track which fields the user tried to submit
  const [showValidation, setShowValidation] = useState(false);

  // Get missing required fields
  const getMissingFields = (): string[] => {
    if (!selectedType?.fields_config) return [];
    const missing: string[] = [];

    for (const field of selectedType.fields_config) {
      if (!field.required) continue;

      // alternateKey: this field OR the alternate field must be filled
      if (field.alternateKey) {
        const altField = selectedType.fields_config.find(f => f.key === field.alternateKey);
        const hasAlt = altField?.type === 'images'
          ? (imageFiles.length > 0 || (isEditMode && editDelivery?.image_filename))
          : !!metadata[field.alternateKey]?.trim();
        const hasCurrent = field.type === 'images'
          ? (imageFiles.length >= (field.min || 1) || (isEditMode && !!editDelivery?.image_filename))
          : !!metadata[field.key]?.trim();
        if (hasCurrent || hasAlt) continue;
        missing.push(`${field.label} ou ${altField?.label || field.alternateKey}`);
        continue;
      }

      if (field.type === 'images') {
        const minImages = field.min || 1;
        // In edit mode, existing images count (user already uploaded them before)
        const hasExistingImages = isEditMode && editDelivery?.image_filename;
        if (imageFiles.length < minImages && !hasExistingImages) {
          missing.push(`${field.label} (${minImages} minimum)`);
        }
      } else if (field.type === 'stars') {
        const rating = parseFloat(metadata[field.key]);
        if (!rating || rating < 0.5) {
          missing.push(field.label);
        }
      } else {
        if (!metadata[field.key]?.trim()) {
          missing.push(field.label);
        }
      }
    }

    return missing;
  };

  const isFieldMissing = (field: { key: string; type: string; required: boolean; min?: number; alternateKey?: string }) => {
    if (!field.required || !showValidation) return false;

    // alternateKey: not missing if the alternate field is filled
    if (field.alternateKey && selectedType) {
      const altField = selectedType.fields_config.find(f => f.key === field.alternateKey);
      const hasAlt = altField?.type === 'images'
        ? (imageFiles.length > 0 || (isEditMode && !!editDelivery?.image_filename))
        : !!metadata[field.alternateKey]?.trim();
      const hasCurrent = field.type === 'images'
        ? (imageFiles.length >= (field.min || 1) || (isEditMode && !!editDelivery?.image_filename))
        : !!metadata[field.key]?.trim();
      return !hasCurrent && !hasAlt;
    }

    if (field.type === 'images') {
      const hasExistingImages = isEditMode && editDelivery?.image_filename;
      return imageFiles.length < (field.min || 1) && !hasExistingImages;
    }
    if (field.type === 'stars') { const r = parseFloat(metadata[field.key]); return !r || r < 0.5; }
    return !metadata[field.key]?.trim();
  };


  // Handle correction click with validation
  const handleCorrectionClick = () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      setShowValidation(true);
      toast.error(`Champs manquants : ${missing.join(', ')}`);
      return;
    }
    handleCorrection();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rs-red border-t-transparent" />
      </div>
    );
  }

  // Success screen
  if (submitSuccess) {
    const title = getTitle();
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-rs-black mb-2">
          {isEditMode ? 'Papier modifie !' : 'Papier livre !'}
        </h1>
        <p className="text-gray-500 mb-6">
          {isEditMode
            ? <>Votre papier <strong>{title}</strong> a bien ete mis a jour dans Dropbox.</>
            : <>Votre papier <strong>{title}</strong> a bien ete envoye dans Dropbox. L'equipe a ete notifiee par email.</>
          }
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
        <h1 className="text-2xl font-bold text-rs-black">
          {isEditMode ? 'Modifier un papier' : 'Livrer un papier'}
        </h1>
        {nextHebdo && (
          <p className="text-gray-500 text-sm mt-1">
            {nextHebdo.label} — Numero {nextHebdo.numero}
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

      {/* Step 1: Hebdo Confirmation + Paper Type */}
      {step === 'type' && (
        <div className="space-y-6">
          {/* Hebdo display — auto-detected, journalist just confirms */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-rs-black mb-2">Numero en cours</h2>

            {!nextHebdo ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                Aucun numero programme. Contactez l'admin.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hebdo card */}
                <div className={`flex items-center gap-4 p-5 rounded-lg border-2 ${
                  hebdoConfirmed ? 'border-green-500 bg-green-50' : 'border-rs-red bg-rs-red/5'
                }`}>
                  <Calendar size={28} className={hebdoConfirmed ? 'text-green-600' : 'text-rs-red'} />
                  <div className="flex-1">
                    <span className="text-xl font-bold text-rs-black">{nextHebdo.label}</span>
                    {nextHebdo.start_date && nextHebdo.end_date && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        du {format(new Date(nextHebdo.start_date + 'T00:00:00'), 'd', { locale: fr })} au{' '}
                        {format(new Date(nextHebdo.end_date + 'T00:00:00'), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                  {hebdoConfirmed && (
                    <CheckCircle size={24} className="text-green-600 shrink-0" />
                  )}
                </div>

                {/* Confirm button */}
                {!hebdoConfirmed && (
                  <button
                    onClick={handleConfirmHebdo}
                    disabled={preparingFolders}
                    className="w-full flex items-center justify-center gap-2 bg-rs-red hover:bg-rs-red-dark disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    {preparingFolders ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Preparation des dossiers...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Confirmer ce numero
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Paper type selector — only visible once hebdo is confirmed */}
          {hebdoConfirmed && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-rs-black mb-4">Type de papier</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paperTypes.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => {
                      setSelectedType(pt);
                      setMetadata({});
                      setImageFiles([]);
                      setImagePreviews([]);
                      setBodyCorrected('');
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

      {/* Step 2: Content - Dynamic fields based on paper type */}
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
              {/* Render dynamic fields based on fields_config */}
              {selectedType.fields_config?.map((field) => {
                // Handle image fields separately
                if (field.type === 'images') {
                  const missing = isFieldMissing(field);
                  const isOptionalViaAlternate = !!field.alternateKey;
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && !isOptionalViaAlternate && <span className="text-rs-red">*</span>}
                      </label>

                      {/* Display uploaded images */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-rs-red text-white rounded-full p-1 hover:bg-rs-red-dark transition-colors"
                              >
                                <X size={14} />
                              </button>
                              <p className="text-xs text-gray-500 mt-1 truncate">{imageFiles[index]?.name}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dropzone for adding more images */}
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive
                            ? 'border-rs-red bg-rs-red/5'
                            : missing
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-300 hover:border-rs-red'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Image size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Glissez des images ici ou <span className="text-rs-red font-medium">cliquez pour choisir</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {field.min ? `${field.min} photos minimum` : 'JPG, PNG, WebP — Max 10 Mo par fichier'}
                        </p>
                        {isEditMode && editDelivery?.image_filename && imageFiles.length === 0 && (
                          <p className="text-xs text-blue-600 mt-2">
                            Images existantes : {editDelivery.image_filename}
                            <br />
                            <span className="text-gray-400">Ajoutez de nouvelles images pour les remplacer</span>
                          </p>
                        )}
                        {imagePreviews.length > 0 && (
                          <p className="text-xs text-green-600 mt-2">
                            {imagePreviews.length} photo{imagePreviews.length > 1 ? 's' : ''} ajoutée{imagePreviews.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      {missing && (
                        <p className="text-xs text-red-600 mt-1">
                          {field.alternateKey
                            ? 'Ajoutez des photos ou renseignez le lien Drive ci-dessus'
                            : field.min ? `${field.min} photo(s) minimum requise(s)` : 'Au moins une photo est requise'}
                        </p>
                      )}
                    </div>
                  );
                }

                // Handle text fields
                if (field.type === 'text') {
                  const missing = isFieldMissing(field);
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-rs-red">*</span>}
                      </label>
                      <input
                        type="text"
                        value={metadata[field.key] || ''}
                        onChange={(e) => updateMetadata(field.key, e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm ${
                          missing ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        required={field.required}
                      />
                      {missing && <p className="text-xs text-red-600 mt-1">Ce champ est obligatoire</p>}
                    </div>
                  );
                }

                // Handle URL fields
                if (field.type === 'url') {
                  const missing = isFieldMissing(field);
                  const isOptionalViaAlternate = !!field.alternateKey;
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && !isOptionalViaAlternate && <span className="text-rs-red">*</span>}
                        {isOptionalViaAlternate && <span className="text-gray-400 text-xs ml-1">(ou ajoutez des photos)</span>}
                      </label>
                      <input
                        type="url"
                        value={metadata[field.key] || ''}
                        onChange={(e) => updateMetadata(field.key, e.target.value)}
                        placeholder="https://..."
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm ${
                          missing ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {missing && <p className="text-xs text-red-600 mt-1">Renseignez un lien ou ajoutez des photos ci-dessous</p>}
                    </div>
                  );
                }

                // Handle star rating fields (half-star support via left/right click zones)
                if (field.type === 'stars') {
                  const maxStars = field.max || 5;
                  const currentRating = parseFloat(metadata[field.key]) || 0;
                  const missing = isFieldMissing(field);

                  const handleStarClick = (starIndex: number, e: React.MouseEvent<HTMLButtonElement>) => {
                    // Detect if click is on left half or right half of the star
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const isLeftHalf = clickX < rect.width / 2;

                    const newRating = isLeftHalf ? starIndex - 0.5 : starIndex;

                    // If clicking same value, reset to 0
                    if (newRating === currentRating) {
                      updateMetadata(field.key, '0');
                    } else {
                      updateMetadata(field.key, String(newRating));
                    }
                  };

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-rs-red">*</span>}
                      </label>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => {
                          const isFull = currentRating >= star;
                          const isHalf = !isFull && currentRating >= star - 0.5;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={(e) => handleStarClick(star, e)}
                              className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                            >
                              {isHalf ? (
                                <div className="relative" style={{ width: 32, height: 32 }}>
                                  <Star size={32} className="text-gray-300 absolute inset-0" />
                                  <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                    <Star size={32} className="text-yellow-400 fill-yellow-400" />
                                  </div>
                                </div>
                              ) : (
                                <Star
                                  size={32}
                                  className={isFull
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'}
                                />
                              )}
                            </button>
                          );
                        })}
                        {currentRating > 0 && (
                          <span className="ml-3 text-sm font-medium text-gray-600">
                            {currentRating % 1 === 0 ? currentRating : currentRating.toFixed(1)}/{maxStars}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Clic gauche de l'etoile = demi, clic droit = entiere</p>
                      {missing && <p className="text-xs text-red-600 mt-1">Veuillez selectionner une note</p>}
                    </div>
                  );
                }

                // Handle textarea fields
                if (field.type === 'textarea') {
                  const isBodyField = field.key === 'corps';
                  const fieldValue = metadata[field.key] || '';
                  const missing = isFieldMissing(field);

                  return (
                    <div key={field.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label} {field.required && <span className="text-rs-red">*</span>}
                        </label>
                        {isBodyField && (
                          <span
                            className={`text-xs font-mono px-2 py-0.5 rounded ${
                              signOverLimit
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {fieldValue.length.toLocaleString()} / {selectedType.sign_limit.toLocaleString()} signes
                          </span>
                        )}
                      </div>
                      <textarea
                        value={fieldValue}
                        onChange={(e) => updateMetadata(field.key, e.target.value)}
                        rows={isBodyField ? 16 : 4}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-rs-red focus:border-transparent text-sm leading-relaxed resize-y ${
                          missing ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        required={field.required}
                      />
                      {missing && <p className="text-xs text-red-600 mt-1">Ce champ est obligatoire</p>}
                      {isBodyField && signOverLimit && (
                        <p className="text-xs text-red-600 mt-1">
                          Depassement de {(fieldValue.length - selectedType.sign_limit).toLocaleString()} signes
                        </p>
                      )}
                    </div>
                  );
                }

                return null;
              })}
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
              onClick={handleCorrectionClick}
              disabled={correcting}
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
                <dd className="text-sm font-medium text-rs-black">{nextHebdo?.label}</dd>
              </div>

              {/* Display all metadata fields */}
              {selectedType.fields_config?.map((field) => {
                if (field.type === 'images') {
                  return (
                    <div key={field.key} className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">{field.label}</dt>
                      <dd className="text-sm font-medium text-rs-black">
                        {imageFiles.length} photo{imageFiles.length > 1 ? 's' : ''}
                      </dd>
                    </div>
                  );
                }

                const value = field.key === 'corps' && bodyCorrected ? bodyCorrected : metadata[field.key];
                if (!value) return null;

                if (field.type === 'stars') {
                  const rating = parseFloat(value) || 0;
                  const maxStars = field.max || 5;
                  return (
                    <div key={field.key} className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500">{field.label}</dt>
                      <dd className="flex items-center gap-0.5">
                        {Array.from({ length: maxStars }, (_, i) => {
                          const starNum = i + 1;
                          const isFull = rating >= starNum;
                          const isHalf = !isFull && rating >= starNum - 0.5;
                          return isHalf ? (
                            <div key={i} className="relative" style={{ width: 16, height: 16 }}>
                              <Star size={16} className="text-gray-300 absolute inset-0" />
                              <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                              </div>
                            </div>
                          ) : (
                            <Star
                              key={i}
                              size={16}
                              className={isFull ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                            />
                          );
                        })}
                        <span className="ml-2 text-sm font-medium text-rs-black">
                          {rating % 1 === 0 ? rating : rating.toFixed(1)}/{maxStars}
                        </span>
                      </dd>
                    </div>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <div key={field.key} className="py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-500 mb-1">{field.label}</dt>
                      <dd className="text-sm text-rs-black whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {value.substring(0, 200)}{value.length > 200 ? '...' : ''}
                      </dd>
                    </div>
                  );
                }

                return (
                  <div key={field.key} className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm text-gray-500">{field.label}</dt>
                    <dd className="text-sm font-medium text-rs-black truncate max-w-[200px]">
                      {field.type === 'url' ? (
                        <span className="text-blue-600">{value}</span>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                );
              })}

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Signes</dt>
                <dd className={`text-sm font-medium ${signOverLimit ? 'text-red-600' : 'text-rs-black'}`}>
                  {signCount.toLocaleString()} / {signLimit.toLocaleString()}
                </dd>
              </div>
            </dl>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Images jointes</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
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
                  {isEditMode ? 'Enregistrer les modifications' : 'Livrer le papier'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}