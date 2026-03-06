import React, { useState, useEffect } from 'react';
import { Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle, MapPin, AlertCircle, Users, Package, FileEdit, History } from 'lucide-react';
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
        const extracted = { ...formData };

        // Regex for % (Avance)
        const percentageMatch = lowerText.match(/(\d+)\s*(?:%|por ciento)/);
        if (percentageMatch) extracted.avance_porcentaje = `${percentageMatch[1]}%`;

        // Split by keywords
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

        setFormData(extracted);
    };

    // Load draft from LocalStorage
    useEffect(() => {
        const draft = localStorage.getItem('report_draft');
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            setFormData(prev => ({ ...prev, ...parsedDraft }));
        }
    }, []);

    // Geolocation API
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }

        const requestGps = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString()
                    };
                    setFormData(prev => ({ ...prev, gps_location: location }));
                    setGpsStatus('success');
                },
                (error) => {
                    console.error('GPS error:', error);
                    setGpsStatus('error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        requestGps();
    }, []);

    // Auto-save draft
    useEffect(() => {
        localStorage.setItem('report_draft', JSON.stringify(formData));
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

    const removeFoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(f => f.id !== id) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Strict Validation
        if (formData.fotos.length === 0) {
            alert('Debes capturar al menos 1 foto para generar el reporte.');
            return;
        }
        if (!formData.gps_location) {
            alert('El permiso de GPS es obligatorio para el cumplimiento del reporte.');
            return;
        }

        setIsSaving(true);
        setTimeout(() => {
            onSave(formData);
            localStorage.removeItem('report_draft');
            setIsSaving(false);
        }, 1000);
    };

    const startSmartVoiceCapture = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Tu navegador no soporta dictado por voz.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setActiveVoiceField('smart');
        recognition.onend = () => setActiveVoiceField(null);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processSmartDictation(transcript);
        };
        recognition.start();
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-24 font-[family:var(--font-primary)]">
            <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 flex items-center gap-4 backdrop-blur-lg bg-opacity-80">
                <button
                    onClick={onBack}
                    className="p-2.5 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-quoia-primary)] hover:bg-[var(--color-quoia-primary)]/10 rounded-xl transition-all active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-quoia-primary)]">SunSite</h1>
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">Bitácora Oficial de Obra</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-2xl mx-auto">
                {/* GPS Status Banner */}
                <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${gpsStatus === 'success' ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]' :
                    gpsStatus === 'error' ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]' :
                        'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}>
                    {gpsStatus === 'success' ? <MapPin className="w-5 h-5 shadow-sm" /> :
                        gpsStatus === 'error' ? <AlertCircle className="w-5 h-5" /> :
                            <span className="w-5 h-5 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin"></span>}
                    <div className="flex-1">
                        <p className="text-sm font-bold tracking-tight">
                            {gpsStatus === 'success' ? 'Ubicación Confirmada' :
                                gpsStatus === 'error' ? 'GPS Obligatorio' : 'Obteniendo Ubicación...'}
                        </p>
                    </div>
                </div>

                {/* ID & Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                        <label className="block text-xs font-bold mb-2 text-[var(--color-text-muted)] uppercase tracking-wider ml-1">ID Minigranja</label>
                        <input
                            type="text"
                            name="minigranjaId"
                            value={formData.minigranjaId}
                            onChange={handleInputChange}
                            placeholder="Ej: MG-001"
                            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[var(--color-quoia-primary)]/50 focus:border-[var(--color-quoia-primary)] transition-all"
                            required
                        />
                    </div>
                    <div className="group">
                        <label className="block text-xs font-bold mb-2 text-[var(--color-text-muted)] uppercase tracking-wider ml-1">Categoría</label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleInputChange}
                            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[var(--color-quoia-primary)]/50 focus:border-[var(--color-quoia-primary)] transition-all appearance-none cursor-pointer"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* Personal Module */}
                <div className="bg-[var(--color-card)]/50 p-6 rounded-3xl border border-[var(--color-border)] space-y-5">
                    <h2 className="text-xs font-black text-[var(--color-text-muted)] flex items-center gap-2 uppercase tracking-widest">
                        <Users className="w-4 h-4 text-[var(--color-quoia-primary)]" /> Recursos: Personal y Equipos
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight ml-1">Personal Solenium</label>
                            <input
                                type="number"
                                name="personal_solenium"
                                value={formData.personal_solenium}
                                onChange={handleInputChange}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-quoia-primary)]/40 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight ml-1">Personal Contratista</label>
                            <input
                                type="number"
                                name="personal_contratista"
                                value={formData.personal_contratista}
                                onChange={handleInputChange}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-quoia-primary)]/40 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Hardware/Materials Module */}
                <div className="bg-[var(--color-card)]/50 p-6 rounded-3xl border border-[var(--color-border)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                name="materiales_llegaron"
                                checked={formData.materiales_llegaron}
                                onChange={(e) => setFormData(p => ({ ...p, materiales_llegaron: e.target.checked }))}
                                className="w-6 h-6 rounded-lg border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-quoia-primary)] focus:ring-[var(--color-quoia-primary)] transition-all cursor-pointer"
                            />
                        </div>
                        <label className="text-sm font-bold text-[var(--color-text)]">¿Llegó material hoy?</label>
                    </div>
                    {formData.materiales_llegaron && (
                        <textarea
                            name="materiales_detalle"
                            value={formData.materiales_detalle}
                            onChange={handleInputChange}
                            placeholder="Detalla los insumos que llegaron..."
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[var(--color-quoia-primary)]/40 transition-all text-sm h-24 italic"
                        ></textarea>
                    )}
                </div>

                {/* AI Voice Section */}
                <div className="p-8 bg-[var(--color-quoia-primary)]/5 border-2 border-dashed border-[var(--color-quoia-primary)]/20 rounded-[40px] text-center space-y-5 transition-all">
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            disabled={!formData.categoria}
                            onClick={startSmartVoiceCapture}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${activeVoiceField === 'smart'
                                ? 'bg-[var(--color-error)] text-white animate-pulse'
                                : formData.categoria
                                    ? 'bg-[var(--color-quoia-primary)] text-[var(--color-background)] hover:scale-105 active:scale-95 shadow-[var(--color-quoia-primary)]/20'
                                    : 'bg-[var(--color-border)] text-[var(--color-text-muted)] grayscale cursor-not-allowed'
                                }`}
                        >
                            <Mic className="w-10 h-10" />
                        </button>
                        <p className={`mt-4 text-sm font-bold tracking-tight ${formData.categoria ? 'text-[var(--color-quoia-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                            {activeVoiceField === 'smart' ? 'Escuchando bitácora...' : formData.categoria ? 'Pulsa para dictar reporte' : 'Selecciona categoría para habilitar voz'}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-2 font-medium bg-[var(--color-background)]/50 px-3 py-1 rounded-full border border-[var(--color-border)]">
                            Tip: Di "% avance, Actividades, Retos, Pendientes y Novedades"
                        </p>
                    </div>
                </div>

                {/* Structured Fields */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-5">
                        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-5 shadow-sm">
                            <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-black mb-2 block tracking-widest">Estado de Avance</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    name="avance_porcentaje"
                                    value={formData.avance_porcentaje}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent text-3xl font-black outline-none text-[var(--color-quoia-primary)] placeholder:text-[var(--color-border)]"
                                    placeholder="0%"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'actividades', label: 'Actividades Ejecutadas', color: 'text-sky-400', icon: CheckCircle },
                                { id: 'retos', label: 'Retos y Soluciones', color: 'text-[var(--color-warning)]', icon: AlertCircle },
                                { id: 'pendientes', label: 'Pendientes Próximos', color: 'text-violet-400', icon: History },
                                { id: 'novedades', label: 'Novedades / Clima', color: 'text-[var(--color-quoia-primary)]', icon: FileEdit }
                            ].map(item => (
                                <div key={item.id} className={`bg-[var(--color-card)] border transition-all rounded-3xl p-5 ${item.id === 'retos' ? 'border-[var(--color-warning)]/20' : 'border-[var(--color-border)]'}`}>
                                    <label className={`text-[10px] uppercase font-black mb-3 flex items-center gap-2 tracking-widest ${item.color}`}>
                                        <item.icon className="w-3 h-3" /> {item.label}
                                    </label>
                                    <textarea
                                        name={item.id}
                                        value={formData[item.id]}
                                        onChange={handleInputChange}
                                        className="w-full bg-transparent outline-none text-sm font-medium min-h-[80px] leading-relaxed"
                                        placeholder={`Escribe aquí los ${item.label.toLowerCase()}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="pt-8 border-t border-[var(--color-border)]">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <label className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest block mb-1">Evidencia Fotográfica</label>
                            <p className="text-[10px] text-[var(--color-text-muted)] font-medium italic">Sube al menos una captura del progreso actual</p>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${formData.fotos.length > 0 ? 'bg-[var(--color-quoia-primary)]/10 border-[var(--color-quoia-primary)]/30 text-[var(--color-quoia-primary)]' : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]'}`}>
                            {formData.fotos.length === 0 ? 'MÍNIMO 1 FOTO' : `${formData.fotos.length} CAPTURAS`}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative group aspect-video rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)]">
                                <img src={foto.base64} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <button
                                    type="button"
                                    onClick={() => removeFoto(foto.id)}
                                    className="absolute top-3 right-3 p-2 bg-[var(--color-error)]/90 backdrop-blur rounded-full text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-video rounded-3xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)] hover:border-[var(--color-quoia-primary)] hover:text-[var(--color-quoia-primary)] hover:bg-[var(--color-quoia-primary)]/5 cursor-pointer transition-all active:scale-95 group">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-quoia-primary)]/50 transition-all">
                                <Camera className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Añadir Captura</span>
                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-background)]/80 backdrop-blur-2xl border-t border-[var(--color-border)] z-30 flex justify-center pb-8 md:pb-4">
                    <button
                        type="submit"
                        disabled={isSaving || !formData.gps_location || formData.fotos.length === 0 || !formData.categoria}
                        className="w-full max-w-xl bg-[var(--color-quoia-primary)] disabled:bg-[var(--color-border)] disabled:opacity-40 text-[var(--color-background)] font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-2xl shadow-[var(--color-quoia-primary)]/20 text-sm uppercase tracking-widest"
                    >
                        {isSaving ? (
                            <span className="w-6 h-6 border-2 border-[var(--color-background)]/20 border-t-[var(--color-background)] rounded-full animate-spin"></span>
                        ) : <><Save className="w-5 h-5 font-bold" /> GENERAR REPORTE OFICIAL</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportForm;
