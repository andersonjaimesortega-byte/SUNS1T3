import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ReportForm from './components/ReportForm';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import { generateReportPDF, generateReportFile } from './utils/PdfGenerator';
import { saveReport, getAllReports } from './utils/StorageManager';
import { LogOut, ClipboardCheck, PlusCircle, History, Settings, FileText, Share2, Download, ArrowLeft } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [viewState, setViewState] = useState('dashboard'); // 'dashboard', 'form', 'history', 'settings', 'success'
  const [lastReport, setLastReport] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    const loadRecent = async () => {
      const all = await getAllReports();
      setRecentReports(all.slice(0, 3));
    };
    loadRecent();
  }, [viewState]);

  console.log('App Rendering - View:', viewState);

  const handleSaveReport = async (formData) => {
    const filename = `Reporte_${formData.minigranjaId}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;

    const newReport = {
      id: Date.now(),
      filename,
      date: new Date().toLocaleDateString(),
      minigranja: formData.minigranjaId,
      data: formData
    };

    await saveReport(newReport);
    setRecentReports(prev => [newReport, ...prev].slice(0, 5));
    setLastReport(newReport);
    setViewState('success');
  };

  const handleShareReport = async (reportData) => {
    try {
      const file = await generateReportFile(reportData, user);
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `Reporte SunSite - ${reportData.minigranjaId}`,
          text: `Comparto informe de bitácora diaria: ${reportData.minigranjaId}`
        });
      } else {
        alert('La función de compartir no está disponible en este navegador. El reporte se descargará.');
        generateReportPDF(reportData, user);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Error al intentar compartir el reporte.');
    }
  };

  // Helper to render current content
  const renderContent = () => {
    switch (viewState) {
      case 'form':
        return <ReportForm onBack={() => setViewState('dashboard')} onSave={handleSaveReport} />;
      case 'history':
        return <HistoryView onBack={() => setViewState('dashboard')} user={user} />;
      case 'settings':
        return <SettingsView onBack={() => setViewState('dashboard')} />;
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center text-[var(--color-success)] shadow-2xl shadow-[var(--color-success)]/20 border-2 border-[var(--color-success)]/20">
              <ClipboardCheck className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight uppercase">¡Reporte Guardado!</h2>
              <p className="text-sm text-[var(--color-text-muted)] max-w-xs">La bitácora se ha almacenado correctamente en el historial local.</p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={() => generateReportPDF(lastReport.data, user)}
                className="w-full bg-[var(--color-brand-green)] text-[var(--color-background)] font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-brand-green)]/20 text-sm uppercase tracking-widest btn-action"
              >
                <Download className="w-5 h-5" />
                Descargar PDF ({lastReport.data.avance_porcentaje || '0%'})
              </button>

              <button
                onClick={() => handleShareReport(lastReport.data)}
                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-quoia-primary)] font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--color-quoia-primary)]/5 transition-all text-xs uppercase tracking-widest"
              >
                <Share2 className="w-5 h-5" />
                Compartir Informe
              </button>

              <button
                onClick={() => setViewState('dashboard')}
                className="w-full text-[var(--color-text-muted)] font-bold py-4 text-xs uppercase tracking-[0.2em] hover:text-[var(--color-text)] transition-all"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Volver al Inicio
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-8 py-4 animate-in fade-in duration-500">
            <section className="bg-[var(--color-brand-blue)]/5 border border-[var(--color-brand-blue)]/10 p-8 rounded-[32px] relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-brand-blue)]/10 rounded-full blur-3xl group-hover:bg-[var(--color-brand-blue)]/20 transition-all duration-700"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-3 tracking-tight text-[var(--color-brand-blue)]">Bitácora de Campo</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-xs leading-relaxed">Registro oficial de actividades y geolocalización SunSite.</p>
                <button
                  onClick={() => setViewState('form')}
                  className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 active:scale-[0.98] text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[var(--color-brand-blue)]/20 text-sm uppercase tracking-widest"
                >
                  <PlusCircle className="w-5 h-5 font-bold" /> Generar Reporte Diario
                </button>
              </div>
            </section>

            <nav className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setViewState('history')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-[var(--color-border)] rounded-[32px] hover:border-[var(--color-brand-blue)]/30 transition-all active:scale-95 gap-4 group"
              >
                <div className="p-4 bg-[var(--color-background)] rounded-2xl group-hover:bg-[var(--color-brand-blue)]/10 transition-colors">
                  <History className="w-8 h-8 text-[var(--color-brand-blue)]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">Historial</span>
              </button>

              <button
                onClick={() => setViewState('settings')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-[var(--color-border)] rounded-[32px] hover:border-[var(--color-brand-blue)]/30 transition-all active:scale-95 gap-4 group"
              >
                <div className="p-4 bg-[var(--color-background)] rounded-2xl group-hover:bg-[var(--color-brand-blue)]/10 transition-colors">
                  <Settings className="w-8 h-8 text-[var(--color-brand-blue)]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">Ingeniero</span>
              </button>
            </nav>

            {recentReports.length > 0 && (
              <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Últimos Registros</h3>
                  <button onClick={() => setViewState('history')} className="text-[10px] font-bold text-[var(--color-brand-blue)] uppercase tracking-tight hover:underline">Auditar Todo</button>
                </div>
                <div className="space-y-3">
                  {recentReports.map(report => (
                    <div key={report.id} className="bg-white border border-[var(--color-border)] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-background)] rounded-xl flex items-center justify-center border border-[var(--color-border)] text-[var(--color-brand-blue)]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p class="text-xs font-black text-slate-800 flex items-center gap-2">
                            {report.minigranja}
                            <span className="text-[9px] bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] px-1.5 py-0.5 rounded-md border border-[var(--color-brand-green)]/20">
                              {report.data.avance_porcentaje || '0%'}
                            </span>
                          </p>
                          <p class="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-tighter">{report.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => generateReportPDF(report.data, user)}
                        className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/10 rounded-xl transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col font-[family:var(--font-primary)]">
      {(viewState === 'dashboard' || viewState === 'settings' || viewState === 'history') && (
        <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 backdrop-blur-lg bg-opacity-80">
          <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewState('dashboard')}>
              <div className="w-8 h-8 bg-[var(--color-quoia-primary)] rounded-lg flex items-center justify-center">
                <ClipboardCheck className="text-[var(--color-background)] w-5 h-5 font-bold" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-[var(--color-quoia-primary)] uppercase">SunSite</h1>
                <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-widest">{user?.nombre} • {user?.rol}</p>
              </div>
            </div>
            <button
              onClick={() => setViewState('settings')}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${viewState === 'settings' ? 'text-[var(--color-quoia-primary)] bg-[var(--color-quoia-primary)]/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-quoia-primary)] hover:bg-[var(--color-quoia-primary)]/10'}`}
              title="Ajustes"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 p-5 max-w-4xl mx-auto w-full">
        {renderContent()}
      </main>

      {viewState === 'dashboard' && (
        <footer className="p-10 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Solenium Dev Division • SunSite 2026</p>
        </footer>
      )}
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
