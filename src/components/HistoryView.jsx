import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, History, FileText, Share2, Trash2,
    CheckCircle, Calendar, Package, Download
} from 'lucide-react';
import { getAllReports, deleteReport } from '../utils/StorageManager';
import { generateConsolidatedReport } from '../utils/ConsolidationEngine';
import { generateReportPDF } from '../utils/PdfGenerator';

const HistoryView = ({ onBack, user }) => {
    const [reports, setReports] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await getAllReports();
        setReports(data);
        setLoading(false);
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('¿Eliminar este reporte permanentemente?')) {
            await deleteReport(id);
            setReports(prev => prev.filter(r => r.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleGenerateSummary = async () => {
        try {
            const selectedData = reports.filter(r => selectedIds.includes(r.id));
            await generateConsolidatedReport(selectedData, user);
        } catch (error) {
            alert('Error al consolidar reportes. Revisa que los datos sean válidos.');
        }
    };

    const handleSingleDownload = (report) => {
        generateReportPDF(report.data, user);
    };

    const handleShare = async (report, e) => {
        e.stopPropagation();
        try {
            const file = await generateReportFile(report.data, user);
            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: `Reporte SunSite - ${report.minigranja}`,
                    text: `Informe de bitácora: ${report.minigranja} (${report.date})`
                });
            } else {
                alert('Compartir no disponible. Descargando...');
                handleSingleDownload(report);
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Error al compartir.');
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Cargando Historial...</div>;

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-32 font-[family:var(--font-primary)]">
            <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 flex items-center justify-between backdrop-blur-lg bg-opacity-80">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-card)]/80 rounded-xl transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest text-[var(--color-quoia-primary)]">Historial</h1>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{reports.length} Reportes Guardados</p>
                    </div>
                </div>
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => setSelectedIds([])}
                        className="text-[10px] font-black uppercase text-[var(--color-error)] border border-[var(--color-error)]/30 px-3 py-1.5 rounded-lg"
                    >
                        Limpiar ({selectedIds.length})
                    </button>
                )}
            </header>

            <main className="p-5 max-w-xl mx-auto space-y-4">
                {reports.length === 0 ? (
                    <div className="text-center py-20 opacity-30 space-y-4">
                        <History className="w-16 h-16 mx-auto" />
                        <p className="text-sm font-bold uppercase tracking-widest">No hay reportes locales</p>
                    </div>
                ) : (
                    reports.map(report => (
                        <div
                            key={report.id}
                            onClick={() => toggleSelection(report.id)}
                            className={`relative group p-4 border rounded-3xl transition-all duration-300 cursor-pointer ${selectedIds.includes(report.id)
                                ? 'bg-[var(--color-quoia-primary)]/10 border-[var(--color-quoia-primary)]/40 shadow-lg shadow-[var(--color-quoia-primary)]/5 scale-[1.02]'
                                : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-quoia-primary)]/30'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(report.id)
                                    ? 'bg-[var(--color-quoia-primary)] border-[var(--color-quoia-primary)]'
                                    : 'border-[var(--color-border)]'
                                    }`}>
                                    {selectedIds.includes(report.id) && <CheckCircle className="text-[var(--color-background)] w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-sm tracking-tight truncate uppercase">{report.minigranja}</h3>
                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-background)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                                            {report.data.avance_porcentaje}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider mt-1 truncate">
                                        {report.data.categoria}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-[var(--color-text-muted)] opacity-60">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.date}</span>
                                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {report.data.fotos.length} Fotos</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSingleDownload(report); }}
                                        className="p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl hover:text-[var(--color-quoia-primary)] transition-all"
                                        title="Descargar"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleShare(report, e)}
                                        className="p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl hover:text-[var(--color-quoia-primary)] transition-all"
                                        title="Compartir"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(report.id, e)}
                                        className="p-2.5 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-xl hover:bg-[var(--color-error)] transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {selectedIds.length >= 1 && (
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--color-background)]/80 backdrop-blur-2xl border-t border-[var(--color-border)] z-30 animate-in slide-in-from-bottom-full duration-300">
                    <button
                        onClick={handleGenerateSummary}
                        className="w-full max-w-xl mx-auto bg-[var(--color-zentrack-primary)] text-[var(--color-background)] font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-[var(--color-zentrack-primary)]/20 text-xs uppercase tracking-[0.2em]"
                    >
                        <FileText className="w-5 h-5" />
                        {selectedIds.length === 1 ? 'Generar Copia PDF' : `Consolidar ${selectedIds.length} Reportes`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
