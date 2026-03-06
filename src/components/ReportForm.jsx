import React, { useState, useEffect } from 'react';
import { Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle, MapPin, AlertCircle, Users, Package, FileEdit } from 'lucide-react';
import { compressImage, fileToBase64 } from '../utils/ImageHandler';

const ReportForm = ({ onBack, onSave }) => {
    const [formData, setFormData] = useState({
        minigranjaId: '',
        avances: '',
        actividades: '',
        retos: '',
        pendientes: '',
        cantidad_personal: '',
        materiales_recibidos: '',
        observaciones_extra: '',
        fotos: [],
        gps_location: null
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('loading'); // loading, success, error

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

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
            <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20 flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-zinc-400">
                    <ArrowLeft />
                </button>
                <h1 className="text-lg font-bold">Nuevo Reporte</h1>
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
                        <p className="text-xs opacity-80">
                            {gpsStatus === 'success' ? `${formData.gps_location.lat.toFixed(4)}, ${formData.gps_location.lng.toFixed(4)}` :
                                gpsStatus === 'error' ? 'Habilita el GPS para poder enviar el reporte.' : 'Por favor espera...'}
                        </p>
                    </div>
                </div>

                {/* Minigranja ID & Personnel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <label className="block text-sm font-medium mb-2 text-zinc-400 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Cantidad de Personal
                        </label>
                        <input
                            type="number"
                            name="cantidad_personal"
                            value={formData.cantidad_personal}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>
                </div>

                {/* Materials & Extra */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-400 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Materiales Recibidos
                        </label>
                        <textarea
                            name="materiales_recibidos"
                            value={formData.materiales_recibidos}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                            placeholder="Detalle de insumos recibidos hoy..."
                        ></textarea>
                    </div>
                </div>

                {/* Text Areas with Voice */}
                {[
                    { id: 'avances', label: 'Avances del Día' },
                    { id: 'actividades', label: 'Actividades Realizadas' },
                    { id: 'retos', label: 'Retos / Problemas' },
                    { id: 'pendientes', label: 'Pendientes' }
                ].map(field => (
                    <div key={field.id} className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-zinc-400">{field.label}</label>
                            <button
                                type="button"
                                onClick={() => startVoiceCapture(field.id)}
                                className={`p-2 rounded-full transition-colors ${activeVoiceField === field.id ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </div>
                        <textarea
                            name={field.id}
                            value={formData[field.id]}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                            placeholder={`Describe los ${field.label.toLowerCase()}...`}
                        ></textarea>
                    </div>
                ))}

                {/* Observations Extra */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-400 flex items-center gap-2">
                        <FileEdit className="w-4 h-4" /> Observaciones Extra
                    </label>
                    <textarea
                        name="observaciones_extra"
                        value={formData.observaciones_extra}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                        placeholder="Cualquier otro detalle relevante..."
                    ></textarea>
                </div>

                {/* Photo Upload */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-zinc-400">Evidencia Fotográfica</label>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${formData.fotos.length > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {formData.fotos.length === 0 ? 'Mínimo 1 foto requerida' : `${formData.fotos.length} fotos añadidas`}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                                <img src={foto.base64} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeFoto(foto.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white shadow-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition-all active:scale-95">
                            <Camera className="w-8 h-8" />
                            <span className="text-xs">Subir Fotos</span>
                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-900 z-10">
                    <button
                        type="submit"
                        disabled={isSaving || !formData.gps_location || formData.fotos.length === 0}
                        className="w-full max-w-2xl mx-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20"
                    >
                        {isSaving ? (
                            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar y Generar PDF
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportForm;
