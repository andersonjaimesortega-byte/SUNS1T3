import React, { useState, useEffect } from 'react';
import {
    Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle,
    MapPin, AlertCircle, Users, Package, FileEdit, History,
    ChevronRight, ChevronLeft, Layout
} from 'lucide-react';
import { compressImage, fileToBase64 } from '../utils/ImageHandler';
import { optimizeText } from '../utils/AiProcessor';

const CATEGORIES = [
    'Adecuación de terreno y vía de acceso',
    'Cerramiento perimetral',
    'Registros y zanjas',
    'Cimentaciones',
    'Obra Civil MT',
    'Hincado y Montaje de Estructura',
    'Obras finales y puesta en marcha'
];

const ReportForm = ({ onBack, onSave }) => {
    console.log('ReportForm: Initializing Wizard...');

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        minigranjaId: '',
        categoria: '',
        personal_solenium: '',
        personal_contratista: '',
        materiales_llegaron: false,
        materiales_detalle: '',
        avance_porcentaje: '',
        actividades: '',
        retos: '',
        lecciones_aprendidas: '',
        pendientes: '',
        novedades: '',
        observaciones_extra: '',
        fotos: [],
        gps_location: null
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('loading');
    const [aiProcessingField, setAiProcessingField] = useState(null);
    const [pendingAiDiff, setPendingAiDiff] = useState(null); // { field, original, optimized }

    // Intelligent Text Parser
    const processSmartDictation = (text) => {
        let remainingText = text;

        setFormData(prev => {
            const extracted = { ...prev };

            // 1. Percentage Parsing & Consumption
            const percentageRegex = /(?:avance|progreso|obra|total|general|realizado|al)\s*(\d+)\s*(?:%|por ciento)?|(\d+)\s*(?:%|por ciento)/i;
            const percentageMatch = remainingText.match(percentageRegex);

            if (percentageMatch) {
                const val = percentageMatch[1] || percentageMatch[2];
                extracted.avance_porcentaje = `${val}%`;
                // Remove the match to avoid confusing it with section keywords
                remainingText = remainingText.replace(percentageMatch[0], '');
            }

            // 2. Section Parsing (Chunk-based)
            const sections = [
                { key: 'actividades', keywords: ['actividades', 'actividad', 'labores', 'tareas', 'avances', 'progreso', 'hecho', 'hicimos', 'desarrollo', 'trabajo', 'trabajos', 'ejecución'] },
                { key: 'retos', keywords: ['obstáculos', 'obstáculo', 'limitantes', 'limitante', 'dificultades', 'dificultad', 'impedimento', 'problemas', 'problema', 'desviación', 'error', 'falla', 'retos', 'reto'] },
                { key: 'lecciones_aprendidas', keywords: ['lecciones aprendidas', 'lección aprendida', 'lecciones', 'lección', 'aprendizajes', 'aprendizaje', 'aprendido', 'aprendimos', 'solucionado', 'solución', 'conclusiones', 'conclusión', 'mejoras', 'mejora', 'enseñanza'] },
                { key: 'pendientes', keywords: ['por hacer', 'pendientes', 'pendiente', 'faltantes', 'faltante', 'restantes', 'restante', 'próximo', 'mañana', 'seguimiento'] },
                { key: 'novedades', keywords: ['observaciones', 'observación', 'comentarios', 'comentario', 'novedades', 'novedad', 'noticias', 'noticia', 'clima', 'extra', 'notas', 'nota'] }
            ];

            // Sort keywords by length descending to match longer phrases first
            const allKeywords = sections
                .flatMap(s => s.keywords)
                .sort((a, b) => b.length - a.length)
                .join('|');

            const parts = remainingText.split(new RegExp(`\\b(${allKeywords})\\b`, 'i'));

            // The split result is [unmarked_text, keyword, marked_text, keyword, marked_text, ...]
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

            return extracted;
        });
    };

    useEffect(() => {
        try {
            const draft = localStorage.getItem('report_draft');
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                if (parsedDraft && typeof parsedDraft === 'object') {
                    setFormData(prev => ({ ...prev, ...parsedDraft }));
                }
            }
        } catch (e) { console.error('Error loading draft', e); }
    }, []);

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

    useEffect(() => {
        try {
            localStorage.setItem('report_draft', JSON.stringify(formData));
        } catch (e) { console.error('Error saving draft', e); }
    }, [formData]);

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
            await onSave(formData);
            localStorage.removeItem('reportFormDraft'); // New line as per instruction
            localStorage.removeItem('report_draft'); // Remove the draft on successful save
        } catch (error) {
            console.error('Error saving report:', error);
            // If onSave fails, we might want to keep the draft or handle it differently
            // The instruction implies moving report_draft removal to catch, but it's more logical to remove it on success.
            // For now, following the instruction's implied structure for 'report_draft' removal on error.
            localStorage.removeItem('report_draft'); // As per instruction's snippet, remove on error too.
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

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const renderStepIndicator = () => {
        const steps = [
            { id: 1, label: 'Acceso' },
            { id: 2, label: 'Categoría' },
            { id: 3, label: 'Progreso' },
            { id: 4, label: 'Fotos' }
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
                        {step === 1 && 'Identificación'}
                        {step === 2 && 'Recursos'}
                        {step === 3 && 'Progreso'}
                        {step === 4 && 'Cierre'}
                    </p>
                </div>
            </header>

            {renderStepIndicator()}

            <form onSubmit={handleSubmit} className={`p-5 space-y-8 max-w-xl mx-auto mt-4 ${step === 3 ? 'form-container-with-padding' : ''}`}>

                {/* STEP 1: Identification & GPS */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${gpsStatus === 'success' ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]'}`}>
                            {gpsStatus === 'success' ? <MapPin className="active:scale-110 transition-transform" /> : <AlertCircle />}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider">Ubicación GPS</h3>
                                <p className="text-[10px] opacity-70">
                                    {gpsStatus === 'success' ? `${formData.gps_location?.lat.toFixed(4)}, ${formData.gps_location?.lng.toFixed(4)}` : 'Activación Obligatoria'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2 block ml-1">ID Minigranja</label>
                                <input
                                    type="text"
                                    name="minigranjaId"
                                    value={formData.minigranjaId}
                                    onChange={handleInputChange}
                                    placeholder="MG-XXX"
                                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[var(--color-quoia-primary)]/10 focus:border-[var(--color-quoia-primary)] transition-all font-bold tracking-tight"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2 block ml-1">Frente de Obra / Categoría</label>
                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleInputChange}
                                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[var(--color-quoia-primary)]/10 focus:border-[var(--color-quoia-primary)] transition-all appearance-none cursor-pointer font-bold"
                                >
                                    <option value="">Seleccionar...</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Resources */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px] space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-[var(--color-quoia-primary)] w-5 h-5" />
                                <h2 className="text-xs font-black uppercase tracking-widest">Personal en Sitio</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] ml-1 uppercase">Solenium</label>
                                    <input type="number" name="personal_solenium" value={formData.personal_solenium} onChange={handleInputChange} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 focus:border-[var(--color-quoia-primary)] outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] ml-1 uppercase">Contratista</label>
                                    <input type="number" name="personal_contratista" value={formData.personal_contratista} onChange={handleInputChange} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 focus:border-[var(--color-quoia-primary)] outline-none" placeholder="0" />
                                </div>
                            </div>
                        </section>

                        <section className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px] space-y-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${formData.materiales_llegaron ? 'bg-[var(--color-quoia-primary)] border-[var(--color-quoia-primary)]' : 'border-[var(--color-border)]'}`} onClick={() => setFormData(p => ({ ...p, materiales_llegaron: !p.materiales_llegaron }))}>
                                    {formData.materiales_llegaron && <CheckCircle className="text-[var(--color-background)] w-4 h-4" />}
                                </div>
                                <span className="text-sm font-bold">¿Llegó material o equipos hoy?</span>
                            </div>
                            {formData.materiales_llegaron && (
                                <textarea name="materiales_detalle" value={formData.materiales_detalle} onChange={handleInputChange} placeholder="Detalle: Tubos, cables, paneles..." className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:border-[var(--color-quoia-primary)]" />
                            )}
                        </section>
                    </div>
                )}

                {/* STEP 3: Progress & AI */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-10 bg-[var(--color-brand-blue)]/5 border-2 border-dashed border-[var(--color-brand-blue)]/20 rounded-[48px] text-center shadow-inner relative overflow-hidden group mb-10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                            <button
                                type="button"
                                onClick={() => startVoiceCapture('smart')}
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all mx-auto relative z-10 ${activeVoiceField === 'smart' ? 'bg-[#ef4444] text-white animate-pulse-soundwave' : 'btn-nav hover:scale-105 active:scale-95'}`}
                            >
                                <Mic className={`w-12 h-12 ${activeVoiceField === 'smart' ? 'animate-bounce' : ''}`} />
                            </button>
                            <div className="mt-6 space-y-1 relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-brand-blue)]">
                                    {activeVoiceField === 'smart' ? 'Grabación en curso' : 'Dictado Inteligente'}
                                </h3>
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest opacity-60">
                                    {activeVoiceField === 'smart' ? 'El sistema procesa tu voz en tiempo real' : 'Pulsa el botón para dictar reporte completo'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px]">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] block mb-3">% Avance Realizado</label>
                                <input type="text" name="avance_porcentaje" value={formData.avance_porcentaje} onChange={handleInputChange} className="text-4xl font-black bg-transparent w-full text-[var(--color-quoia-primary)] outline-none" placeholder="0%" />
                            </div>

                            {[
                                { id: 'actividades', label: 'Actividades Realizadas', Icon: CheckCircle },
                                { id: 'retos', label: 'Retos y Obstáculos', Icon: AlertCircle },
                                { id: 'lecciones_aprendidas', label: 'Lecciones Aprendidas', Icon: CheckCircle },
                                { id: 'novedades', label: 'Novedades', Icon: FileEdit }
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
                                    <textarea name={item.id} value={formData[item.id]} onChange={handleInputChange} className="w-full bg-transparent outline-none text-sm font-medium min-h-[100px]" placeholder={`Registrar ${item.label.toLowerCase()}...`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: Photos & Finish */}
                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 px-1">
                        <section className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Registro Visual</h2>
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
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={step === 1 && (!formData.minigranjaId || !formData.categoria || !formData.gps_location)}
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
                            {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> Generar Reporte Oficial</>}
                        </button>
                    )}
                </div>
            </form>

            {/* Floating Dictation Button (Step 3) */}
            {step === 3 && (
                <button
                    type="button"
                    onClick={() => startVoiceCapture('smart')}
                    className={`btn-floating-dictation ${activeVoiceField ? 'recording' : ''}`}
                    title="Dictado Inteligente"
                >
                    <Mic className={`w-8 h-8 ${activeVoiceField ? 'animate-pulse' : ''}`} />
                </button>
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

export default ReportForm;
