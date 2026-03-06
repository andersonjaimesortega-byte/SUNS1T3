import React, { useState, useEffect } from 'react';
import {
    Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle,
    MapPin, AlertCircle, Users, Package, FileEdit, History,
    ChevronRight, ChevronLeft, Layout
} from 'lucide-react';
import { compressImage, fileToBase64 } from '../utils/ImageHandler';

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
        pendientes: '',
        novedades: '',
        observaciones_extra: '',
        fotos: [],
        gps_location: null
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('loading');

    // Intelligent Text Parser
    const processSmartDictation = (text) => {
        const lowerText = text.toLowerCase();
        setFormData(prev => {
            const extracted = { ...prev };
            const percentageMatch = lowerText.match(/(\d+)\s*(?:%|por ciento)/);
            if (percentageMatch) extracted.avance_porcentaje = `${percentageMatch[1]}%`;

            if (lowerText.includes('actividad')) {
                const block = text.split(/actividad/i)[1]?.split(/reto|pendiente|novedad/i)[0];
                if (block) extracted.actividades = block.trim().replace(/^[:\s\-]+/, '');
            }
            if (lowerText.includes('reto')) {
                const block = text.split(/reto/i)[1]?.split(/actividad|pendiente|novedad/i)[0];
                if (block) extracted.retos = block.trim().replace(/^[:\s\-]+/, '');
            }
            if (lowerText.includes('pendiente')) {
                const block = text.split(/pendiente/i)[1]?.split(/actividad|reto|novedad/i)[0];
                if (block) extracted.pendientes = block.trim().replace(/^[:\s\-]+/, '');
            }
            if (lowerText.includes('novedad')) {
                const block = text.split(/novedad/i)[1]?.split(/actividad|reto|pendiente/i)[0];
                if (block) extracted.novedades = block.trim().replace(/^[:\s\-]+/, '');
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.fotos.length === 0) {
            alert('Mínimo 1 foto requerida.');
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            onSave(formData);
            localStorage.removeItem('report_draft');
            setIsSaving(false);
        }, 800);
    };

    const startSmartVoiceCapture = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Dictado no soportado.');
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setActiveVoiceField('smart');
        recognition.onend = () => setActiveVoiceField(null);
        recognition.onresult = (e) => processSmartDictation(e.results[0][0].transcript);
        recognition.start();
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const renderStepIndicator = () => (
        <div className="px-6 py-2 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/50 backdrop-blur-md sticky top-[68px] z-10">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === i ? 'bg-[var(--color-quoia-primary)] text-[var(--color-background)] scale-110 shadow-lg shadow-[var(--color-quoia-primary)]/20' :
                            step > i ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30' :
                                'bg-[var(--color-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }`}>
                        {step > i ? <CheckCircle className="w-4 h-4" /> : i}
                    </div>
                    {i < 4 && <div className={`w-8 h-[2px] mx-2 ${step > i ? 'bg-[var(--color-success)]/30' : 'bg-[var(--color-border)]'}`}></div>}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-32 font-[family:var(--font-primary)]">
            <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 flex items-center gap-4 backdrop-blur-lg bg-opacity-80">
                <button
                    onClick={step === 1 ? onBack : prevStep}
                    className="p-2.5 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-quoia-primary)] hover:bg-[var(--color-quoia-primary)]/10 rounded-xl transition-all active:scale-95"
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

            <form onSubmit={handleSubmit} className="p-5 space-y-8 max-w-xl mx-auto mt-4">

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
                        <div className="p-8 bg-[var(--color-quoia-primary)]/5 border-2 border-dashed border-[var(--color-quoia-primary)]/20 rounded-[40px] text-center">
                            <button type="button" onClick={startSmartVoiceCapture} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all mx-auto ${activeVoiceField === 'smart' ? 'bg-[var(--color-error)] text-white animate-pulse' : 'bg-[var(--color-quoia-primary)] text-[var(--color-background)] shadow-xl shadow-[var(--color-quoia-primary)]/20 hover:scale-105'}`}>
                                <Mic className="w-10 h-10" />
                            </button>
                            <p className="mt-4 text-xs font-black uppercase tracking-widest text-[var(--color-quoia-primary)]">
                                {activeVoiceField === 'smart' ? 'Escuchando Obra...' : 'Dictado Inteligente'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px]">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] block mb-3">% Avance Realizado</label>
                                <input type="text" name="avance_porcentaje" value={formData.avance_porcentaje} onChange={handleInputChange} className="text-4xl font-black bg-transparent w-full text-[var(--color-quoia-primary)] outline-none" placeholder="0%" />
                            </div>

                            {[
                                { id: 'actividades', label: 'Actividades', Icon: CheckCircle },
                                { id: 'retos', label: 'Retos / Soluciones', Icon: AlertCircle }
                            ].map(item => (
                                <div key={item.id} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px] space-y-4">
                                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
                                        <item.Icon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
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

                        <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px] space-y-4">
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                <FileEdit className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Novedades / Pendientes</span>
                            </div>
                            <textarea name="novedades" value={formData.novedades} onChange={handleInputChange} className="w-full bg-transparent outline-none text-sm font-medium min-h-[100px]" placeholder="Algo más por reportar?" />
                        </div>
                    </div>
                )}

                {/* NAV FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--color-background)]/80 backdrop-blur-2xl border-t border-[var(--color-border)] z-30 flex gap-4 max-w-xl mx-auto">
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={step === 1 && (!formData.minigranjaId || !formData.categoria || !formData.gps_location)}
                            className="w-full bg-[var(--color-quoia-primary)] disabled:opacity-30 text-[var(--color-background)] font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-[var(--color-quoia-primary)]/20 text-xs uppercase tracking-widest"
                        >
                            Siguiente Paso <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSaving || formData.fotos.length === 0}
                            className="w-full bg-[var(--color-quoia-primary)] disabled:opacity-30 text-[var(--color-background)] font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-[var(--color-quoia-primary)]/20 text-xs uppercase tracking-widest"
                        >
                            {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> Generar Reporte Oficial</>}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ReportForm;
