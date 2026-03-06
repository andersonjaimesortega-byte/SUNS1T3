import React, { useState, useEffect } from 'react';
import { Camera, Mic, Save, ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import { compressImage, fileToBase64 } from '../utils/ImageHandler';

const ReportForm = ({ onBack, onSave }) => {
    const [formData, setFormData] = useState({
        minigranjaId: '',
        avances: '',
        actividades: '',
        retos: '',
        pendientes: '',
        fotos: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null);

    // Load draft from LocalStorage
    useEffect(() => {
        const draft = localStorage.getItem('report_draft');
        if (draft) {
            setFormData(JSON.parse(draft));
        }
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
        setIsSaving(true);
        // Simulate API/Storage delay
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
                {/* Minigranja ID */}
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

                {/* Photo Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-400">Evidencia Fotográfica</label>
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
                        disabled={isSaving}
                        className="w-full max-w-2xl mx-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20"
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
