import React, { useState, useEffect } from 'react';
import { Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle, MapPin, AlertCircle, Users, Package, FileEdit } from 'lucide-react';
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
        const keywords = {
            actividades: ['actividad', 'ejecut', 'haciendo', 'hicimos'],
            retos: ['reto', 'problema', 'dificultad', 'solucion'],
            pendientes: ['pendiente', 'falt', 'por hacer', 'mañana'],
            novedades: ['novedad', 'extra', 'aviso', 'noticia', 'clima', 'lluvia']
        };

        let lastIndex = 0;
        const keys = Object.keys(keywords);

        // Simple logic to extract text blocks between keywords
        const sections = lowerText.split(/\b(?:actividades|ejecutado|retos|problemas|pendientes|novedades)\b/i);

        // This is a simplified version of the parser
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

    const startVoiceCapture = (field) => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Tu navegador no soporta dictado por voz.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.onstart = () => setActiveVoiceField(field);
        recognition.onend = () => setActiveVoiceField(null);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setFormData(prev => ({
                ...prev,
                [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript
            }));
        };
        recognition.start();
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20 flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-zinc-400">
                    <ArrowLeft />
                </button>
                <h1 className="text-lg font-bold">Nueva Bitácora Inteligente</h1>
            </header>

            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-2xl mx-auto">
                {/* GPS Status Banner */}
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${gpsStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                    gpsStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                        'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                    {gpsStatus === 'success' ? <MapPin className="w-5 h-5" /> :
                        gpsStatus === 'error' ? <AlertCircle className="w-5 h-5" /> :
                            <span className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></span>}
                    <div className="flex-1">
                        <p className="text-sm font-bold">
                            {gpsStatus === 'success' ? 'Ubicación Confirmada' :
                                gpsStatus === 'error' ? 'GPS Obligatorio' : 'Obteniendo Ubicación...'}
                        </p>
                    </div>
                </div>

                {/* ID & Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-400">ID Minigranja</label>
                        <input
                            type="text"
                            name="minigranjaId"
                            value={formData.minigranjaId}
                            onChange={handleInputChange}
                            placeholder="Ej: MG-001"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-400">Categoría</label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {/* Personal Module */}
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 space-y-4">
                    <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Recursos: Personal y Equipos
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Personal Solenium</label>
                            <input
                                type="number"
                                name="personal_solenium"
                                value={formData.personal_solenium}
                                onChange={handleInputChange}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Personal Contratista</label>
                            <input
                                type="number"
                                name="personal_contratista"
                                value={formData.personal_contratista}
                                onChange={handleInputChange}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Hardware/Materials Module */}
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="materiales_llegaron"
                            checked={formData.materiales_llegaron}
                            onChange={(e) => setFormData(p => ({ ...p, materiales_llegaron: e.target.checked }))}
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label className="text-sm font-bold text-zinc-300">¿Llegó material hoy?</label>
                    </div>
                    {formData.materiales_llegaron && (
                        <textarea
                            name="materiales_detalle"
                            value={formData.materiales_detalle}
                            onChange={handleInputChange}
                            placeholder="Detalla los insumos que llegaron..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-20"
                        ></textarea>
                    )}
                </div>

                {/* AI Voice Section */}
                <div className="p-6 bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-3xl text-center space-y-4">
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            disabled={!formData.categoria}
                            onClick={startSmartVoiceCapture}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${activeVoiceField === 'smart'
                                ? 'bg-red-500 text-white animate-pulse'
                                : formData.categoria ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-90' : 'bg-zinc-800 text-zinc-600 grayscale'
                                }`}
                        >
                            <Mic className="w-8 h-8" />
                        </button>
                        <p className={`mt-3 text-sm font-bold ${formData.categoria ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {activeVoiceField === 'smart' ? 'Escuchando bitácora...' : formData.categoria ? 'Púlsa para dictar bitácora' : 'Selecciona categoría para dictar'}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 italic">
                            Tip: Di "% avance, Actividades, Retos, Pendientes y Novedades"
                        </p>
                    </div>
                </div>

                {/* Structured Fields */}
                <div className="space-y-4">
                    <div className="grid grid-cols-[100px_1fr] gap-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Avance</label>
                            <input
                                type="text"
                                name="avance_porcentaje"
                                value={formData.avance_porcentaje}
                                onChange={handleInputChange}
                                className="w-full bg-transparent text-lg font-bold outline-none text-emerald-500"
                                placeholder="0%"
                            />
                        </div>
                        <div className="space-y-4">
                            {[
                                { id: 'actividades', label: 'Actividades', color: 'text-blue-400' },
                                { id: 'retos', label: 'Retos/Soluciones', color: 'text-orange-400' },
                                { id: 'pendientes', label: 'Pendientes', color: 'text-purple-400' },
                                { id: 'novedades', label: 'Novedades/Clima', color: 'text-emerald-400' }
                            ].map(item => (
                                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                                    <label className={`text-[10px] uppercase font-bold mb-1 block ${item.color}`}>{item.label}</label>
                                    <textarea
                                        name={item.id}
                                        value={formData[item.id]}
                                        onChange={handleInputChange}
                                        className="w-full bg-transparent outline-none text-sm min-h-[60px]"
                                        placeholder={`Contenido de ${item.label.toLowerCase()}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="pt-4 border-t border-zinc-900">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-zinc-400">Evidencia Fotográfica</label>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${formData.fotos.length > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {formData.fotos.length === 0 ? 'MÍNIMO 1 REQUERIDA' : `${formData.fotos.length} FOTOS`}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                                <img src={foto.base64} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeFoto(foto.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 backdrop-blur rounded-full text-white"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-video rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition-all active:scale-95 bg-zinc-900/30">
                            <Camera className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase">Añadir Captura</span>
                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 z-10 flex justify-center">
                    <button
                        type="submit"
                        disabled={isSaving || !formData.gps_location || formData.fotos.length === 0 || !formData.categoria}
                        className="w-full max-w-xl bg-emerald-600 disabled:opacity-30 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/20"
                    >
                        {isSaving ? (
                            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : <><Save className="w-5 h-5" /> GENERAR REPORTE PDF</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportForm;
