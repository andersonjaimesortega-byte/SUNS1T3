import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, History, FileText, Share2, Trash2,
    CheckCircle, Calendar, Package, Download
} from 'lucide-react';
import { getAllReports, deleteReport } from '../utils/StorageManager';
import { generateConsolidatedReport, prepareConsolidatedData } from '../utils/ConsolidationEngine';
import { generateReportPDF, generateReportFile } from '../utils/PdfGenerator';

const HistoryView = ({ onBack, user }) => {
    const [reports, setReports] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        const data = await getAllReports();
        setReports(data);
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadHistory();
    }, []);

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
            if (selectedData.length === 0) {
                alert('No has seleccionado ningún reporte para consolidar.');
                return;
            }
            await generateConsolidatedReport(selectedData, user);
        } catch (error) {
            console.error('Detailed Consolidation Error:', error);
            alert(`No se pudo consolidar: ${error.message}. Por favor revisa que los reportes no tengan datos corruptos.`);
        }
    };

    const handleShareConsolidated = async () => {
        try {
            const selectedData = reports.filter(r => selectedIds.includes(r.id));
            if (selectedData.length === 0) return;

            const combinedData = prepareConsolidatedData(selectedData);
            const file = await generateReportFile(combinedData, user);

            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: `Resumen Consolidado SunSite`,
                    text: `Comparto informe consolidado de ${selectedData.length} registros.`
                });
            } else {
                alert('La función de compartir no está disponible en este navegador. El reporte se descargará.');
                generateConsolidatedReport(selectedData, user);
            }
        } catch (error) {
            console.error('Error sharing consolidated:', error);
            alert('Error al intentar compartir el consolidado.');
        }
    };

    const handleSingleDownload = (report) => {
        generateReportPDF({ ...report.data, date: report.date }, user);
    };

    const handleShare = async (report, e) => {
        e.stopPropagation();
        try {
            const file = await generateReportFile({ ...report.data, date: report.date }, user);
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
                                        <span className="text-[10px] font-black text-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 px-2.5 py-1 rounded-full border border-[var(--color-brand-green)]/20">
                                            {report.data.avance_porcentaje || '0%'}
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
                                        className="p-2.5 bg-white border border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/5 hover:border-[var(--color-brand-blue)]/20 shadow-sm transition-all active:scale-95"
                                        title="Descargar"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleShare(report, e)}
                                        className="p-2.5 bg-white border border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/5 hover:border-[var(--color-brand-green)]/20 shadow-sm transition-all active:scale-95"
                                        title="Compartir"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(report.id, e)}
                                        className="p-2.5 bg-[var(--color-error)]/5 text-[var(--color-error)] rounded-xl border border-[var(--color-error)]/10 hover:bg-[var(--color-error)] hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm active:scale-95"
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
                    <div className="max-w-xl mx-auto flex gap-3">
                        <button
                            onClick={handleGenerateSummary}
                            className="flex-1 btn-nav text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-2 shadow-2xl transition-all text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Previsualizar PDF
                        </button>
                        <button
                            onClick={handleShareConsolidated}
                            className="flex-[2] btn-action text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl text-xs uppercase tracking-[0.2em] active:scale-95 transition-all text-center"
                        >
                            <Share2 className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">
                                {selectedIds.length === 1 ? 'Compartir Copia' : `Compartir ${selectedIds.length} Reportes`}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
