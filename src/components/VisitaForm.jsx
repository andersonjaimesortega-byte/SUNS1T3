import React, { useState, useEffect } from 'react';
import {
    Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle,
    MapPin, AlertCircle, FileEdit, ChevronRight
} from 'lucide-react';
import { compressImage, fileToBase64 } from '../utils/ImageHandler';
import { optimizeText } from '../utils/AiProcessor';
import FloatingDictationButton from './FloatingDictationButton';

const VisitaForm = ({ onBack, onSave }) => {
    console.log('VisitaForm: Initializing Wizard...');

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Datos del Predio
        nombrePredio: '',
        gps_location: null,
        // Estado de Accesos
        estadoVias: '',
        estadoCercado: '',
        // Observaciones Técnicas
        observaciones_tecnicas: '',
        // Registro Fotográfico
        fotos: [],
        tipoReporte: 'visita' // flag to distinguish later
    });

    const [isSaving, setIsSaving] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('loading');
    const [aiProcessingField, setAiProcessingField] = useState(null);
    const [pendingAiDiff, setPendingAiDiff] = useState(null);

    // Intelligent Text Parser for Visita
    const processSmartDictation = (text) => {
        let remainingText = text;

        setFormData(prev => {
            const extracted = { ...prev };

            const sections = [
                { key: 'estadoVias', keywords: ['vías', 'vía', 'acceso', 'carretera', 'camino'] },
                { key: 'estadoCercado', keywords: ['cercado', 'cerco', 'alambrado', 'perímetro', 'lindero'] },
                { key: 'observaciones_tecnicas', keywords: ['observaciones', 'observación', 'técnico', 'notas', 'nota', 'detalles'] }
            ];

            const allKeywords = sections
                .flatMap(s => s.keywords)
                .sort((a, b) => b.length - a.length)
                .join('|');

            const parts = remainingText.split(new RegExp(`\\b(${allKeywords})\\b`, 'i'));

            for (let i = 1; i < parts.length; i += 2) {
                const keyword = parts[i].toLowerCase();
                const content = parts[i + 1]?.trim().replace(/^[:\s\-]+/, '');

                if (content) {
                    const section = sections.find(s => s.keywords.includes(keyword));
                    if (section) {
                        extracted[section.key] = content;
                    }
                }
            }

            // If it didn't strictly match a section, but we are dictating globally,
            // we could dump the rest into observaciones_tecnicas
            if (parts.length === 1 && parts[0].trim()) {
                extracted.observaciones_tecnicas = (extracted.observaciones_tecnicas ? extracted.observaciones_tecnicas + ' ' : '') + parts[0].trim();
            }

            return extracted;
        });
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    gps_location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString()
                    }
                }));
                setGpsStatus('success');
            },
            () => setGpsStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        const compressedFiles = await Promise.all(
            files.map(async (file) => {
                const compressed = await compressImage(file);
                const base64 = await fileToBase64(compressed);
                return { id: Date.now() + Math.random(), base64, name: file.name };
            })
        );
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...compressedFiles] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.fotos.length === 0) {
            alert('Mínimo 1 foto requerida.');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({
                // Map properties to common structure or keep specific
                // minigranjaId works as the primary id for reports in App.jsx
                minigranjaId: formData.nombrePredio,
                ...formData
            });
        } catch (error) {
            console.error('Error saving report:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const startVoiceCapture = (targetField = 'smart') => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Dictado no soportado.');
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setActiveVoiceField(targetField);
        recognition.onend = () => setActiveVoiceField(null);
        recognition.onresult = async (e) => {
            const transcript = e.results[0][0].transcript;
            if (targetField === 'smart') {
                processSmartDictation(transcript);
            } else {
                setAiProcessingField(targetField);
                try {
                    const optimized = await optimizeText(transcript, targetField);
                    setPendingAiDiff({
                        field: targetField,
                        original: transcript,
                        optimized: optimized
                    });
                } catch (error) {
                    console.error('AI Processing Error:', error);
                    setFormData(prev => ({ ...prev, [targetField]: transcript }));
                } finally {
                    setAiProcessingField(null);
                }
            }
        };
        recognition.start();
    };

    const applyAiOptimization = () => {
        if (!pendingAiDiff) return;
        setFormData(prev => ({ ...prev, [pendingAiDiff.field]: pendingAiDiff.optimized }));
        setPendingAiDiff(null);
    };

    const discardAiOptimization = () => {
        if (!pendingAiDiff) return;
        setFormData(prev => ({ ...prev, [pendingAiDiff.field]: pendingAiDiff.original }));
        setPendingAiDiff(null);
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const renderStepIndicator = () => {
        const steps = [
            { id: 1, label: 'Predio' },
            { id: 2, label: 'Inspección' },
            { id: 3, label: 'Fotos' }
        ];

        return (
            <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-[68px] z-10 overflow-x-auto no-scrollbar">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${step === s.id ? 'bg-[var(--color-brand-blue)] text-white scale-110 shadow-lg shadow-[var(--color-brand-blue)]/20 shadow-md ring-4 ring-[var(--color-brand-blue)]/10' :
                                step > s.id ? 'bg-[var(--color-brand-green)] text-white' :
                                    'bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                                }`}>
                                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-tighter ${step === s.id ? 'text-[var(--color-brand-blue)]' : (step > s.id ? 'text-[var(--color-brand-green)]' : 'text-[var(--color-text-muted)]')}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-[2px] flex-1 mx-2 min-w-[15px] ${step > s.id ? 'bg-[var(--color-brand-green)]/40' : 'bg-[var(--color-border)]'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-32 font-[family:var(--font-primary)]">
            <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 flex items-center gap-4 backdrop-blur-lg bg-opacity-80">
                <button
                    onClick={step === 1 ? onBack : prevStep}
                    className="p-2.5 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10 rounded-xl transition-all active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-quoia-primary)]">SunSite Wizard</h1>
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">
                        Visita de Terreno
                    </p>
                </div>
            </header>

            {renderStepIndicator()}

            <form onSubmit={handleSubmit} className={`p-5 space-y-8 max-w-xl mx-auto mt-4 ${step === 2 ? 'form-container-with-padding' : ''}`}>

                {/* STEP 1: Identification & GPS */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${gpsStatus === 'success' ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]'}`}>
                            {gpsStatus === 'success' ? <MapPin className="active:scale-110 transition-transform" /> : <AlertCircle />}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider">Ubicación GPS</h3>
                                <p className="text-[10px] opacity-70">
                                    {gpsStatus === 'success' ? `${formData.gps_location?.lat.toFixed(4)}, ${formData.gps_location?.lng.toFixed(4)}` : 'Activación Obligatoria para Visita'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2 block ml-1">Nombre del Predio</label>
                                <input
                                    type="text"
                                    name="nombrePredio"
                                    value={formData.nombrePredio}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Finca Las Brisas"
                                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[var(--color-quoia-primary)]/10 focus:border-[var(--color-quoia-primary)] transition-all font-bold tracking-tight"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Inspección (Accesos y Observaciones con IA) */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { id: 'estadoVias', label: 'Estado de Accesos (Vía)', Icon: MapPin },
                                { id: 'estadoCercado', label: 'Estado de Cercado / Linderos', Icon: CheckCircle },
                                { id: 'observaciones_tecnicas', label: 'Observaciones Técnicas', Icon: FileEdit }
                            ].map(item => (
                                <div key={item.id} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px] space-y-4 shadow-sm relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                            <item.Icon className="w-4 h-4 text-[var(--color-brand-blue)]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                            {aiProcessingField === item.id && <span className="spinner-mini ml-2"></span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => startVoiceCapture(item.id)}
                                            className={`p-2 rounded-lg transition-all ${activeVoiceField === item.id ? 'bg-red-500 text-white animate-pulse' : 'text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10'}`}
                                        >
                                            <Mic className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <textarea name={item.id} value={formData[item.id]} onChange={handleInputChange} className="w-full bg-transparent outline-none text-sm font-medium min-h-[100px]" placeholder={`Registrar detalles de ${item.label.toLowerCase()}...`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: Photos & Finish */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 px-1">
                        <section className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Registro Fotográfico del Predio</h2>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${formData.fotos.length > 0 ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
                                    {formData.fotos.length} FOTOS
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {formData.fotos.map(foto => (
                                    <div key={foto.id} className="relative aspect-video rounded-3xl overflow-hidden border border-[var(--color-border)] shadow-md group">
                                        <img src={foto.base64} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, fotos: p.fotos.filter(f => f.id !== foto.id) }))} className="absolute top-2 right-2 p-2 bg-red-500 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-video rounded-3xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-2 hover:border-[var(--color-quoia-primary)] cursor-pointer transition-all bg-[var(--color-card)]/30 group">
                                    <Camera className="w-8 h-8 text-[var(--color-text-muted)] group-hover:text-[var(--color-quoia-primary)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Capturar</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        </section>
                    </div>
                )}

                {/* NAV FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--color-background)]/80 backdrop-blur-2xl border-t border-[var(--color-border)] z-30 flex gap-4 max-w-xl mx-auto">
                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={step === 1 && (!formData.nombrePredio || !formData.gps_location)}
                            className="w-full btn-action font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 text-xs uppercase tracking-widest"
                        >
                            Siguiente Paso <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSaving || formData.fotos.length === 0}
                            className="w-full btn-action font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 text-xs uppercase tracking-widest"
                        >
                            {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> Generar Reporte Visita</>}
                        </button>
                    )}
                </div>
            </form>

            {/* Floating Dictation Button (Step 2 is Inspección text areas) */}
            {step === 2 && (
                <FloatingDictationButton
                    onStartCapture={startVoiceCapture}
                    activeField={activeVoiceField}
                />
            )}

            {/* AI Review Modal */}
            {pendingAiDiff && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--color-card)] w-full max-w-lg rounded-[40px] p-8 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[var(--color-brand-green)]/10 rounded-2xl flex items-center justify-center text-[var(--color-brand-green)]">
                                <FileEdit className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest">Optimización IA</h3>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">Campo: {pendingAiDiff.field}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Original (Dictado)</label>
                                <div className="p-4 bg-[var(--color-background)] rounded-2xl text-xs text-[var(--color-text-muted)] italic border border-[var(--color-border)]">
                                    "{pendingAiDiff.original}"
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--color-brand-green)] uppercase tracking-widest ml-1">Optimizado por SunSite IA</label>
                                <div className="p-5 bg-[var(--color-brand-green)]/5 rounded-2xl text-sm font-medium border border-[var(--color-brand-green)]/20 text-[var(--color-text)] leading-relaxed">
                                    {pendingAiDiff.optimized}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={discardAiOptimization}
                                className="flex-1 py-4.5 rounded-2xl border border-[var(--color-border)] text-[var(--color-text-muted)] font-black uppercase text-[10px] tracking-widest hover:bg-[var(--color-error)]/5 hover:text-[var(--color-error)] transition-all active:scale-95"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={applyAiOptimization}
                                className="flex-[2] btn-action text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-xl active:scale-95"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Aplicar Mejora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitaForm;
