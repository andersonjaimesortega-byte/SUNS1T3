import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ReportForm from './components/ReportForm';
import { generateReportPDF, generateReportFile } from './utils/PdfGenerator';
import { LogOut, ClipboardCheck, PlusCircle, History, Settings, FileText, Share2, Download } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, syncUsers } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState([]);

  const handleSaveReport = async (formData) => {
    const filename = await generateReportPDF(formData, user);
    const newReport = {
      id: Date.now(),
      filename,
      date: new Date().toLocaleDateString(),
      minigranja: formData.minigranjaId,
      data: formData // Save data for re-sharing
    };

    setReports(prev => [newReport, ...prev]);
    setShowForm(false);

    // Auto-share on completion if possible
    if (navigator.share) {
      setTimeout(() => handleShare(newReport), 1000);
    }
  };

  const handleShare = async (report) => {
    if (!navigator.share) {
      // Fallback for PC: just download
      generateReportPDF(report.data, user);
      return;
    }

    try {
      const file = await generateReportFile(report.data, user);
      await navigator.share({
        files: [file],
        title: `Bitácora ${report.minigranja}`,
        text: `Reporte de obra - ${report.minigranja} (${report.date})`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = (report) => {
    generateReportPDF(report.data, user);
  };

  if (showForm) {
    return <ReportForm onBack={() => setShowForm(false)} onSave={handleSaveReport} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col font-[family:var(--font-primary)]">
      {/* Header */}
      <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 backdrop-blur-lg bg-opacity-80">
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-quoia-primary)] rounded-lg flex items-center justify-center">
              <ClipboardCheck className="text-[var(--color-background)] w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-[var(--color-quoia-primary)] uppercase">SunSite</h1>
              <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-widest">{user?.nombre} • ID: {user?.id}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-xl transition-all active:scale-95"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 max-w-4xl mx-auto w-full space-y-8 py-8">
        <section className="bg-[var(--color-quoia-primary)]/5 border border-[var(--color-quoia-primary)]/10 p-8 rounded-[32px] relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-quoia-primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--color-quoia-primary)]/20 transition-all duration-700"></div>

          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 flex items-center gap-3 tracking-tight">
              Bitácora de Obra
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-xs leading-relaxed">
              Registra avances, personal y novedades con dictado inteligente.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-[var(--color-quoia-primary)] hover:scale-[1.02] active:scale-[0.98] text-[var(--color-background)] font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[var(--color-quoia-primary)]/20 text-sm uppercase tracking-widest"
            >
              <PlusCircle className="w-5 h-5 font-bold" />
              Nueva Bitácora Oficial
            </button>
          </div>
        </section>

        {reports.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <History className="w-3 h-3" /> Reportes Recientes
            </h2>
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-3xl flex items-center justify-between gap-4 group hover:border-[var(--color-quoia-primary)]/30 transition-all">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-3 bg-[var(--color-quoia-primary)]/10 rounded-2xl shrink-0 group-hover:bg-[var(--color-quoia-primary)]/20 transition-colors">
                      <FileText className="text-[var(--color-quoia-primary)] w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-sm truncate tracking-tight">{report.filename}</h3>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5 uppercase tracking-wider">{report.date} • {report.minigranja}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleShare(report)}
                      className="p-3 text-[var(--color-quoia-primary)] bg-[var(--color-quoia-primary)]/5 hover:bg-[var(--color-quoia-primary)]/20 rounded-xl transition-all active:scale-90"
                      title="Compartir"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-3 text-[var(--color-text-muted)] bg-[var(--color-background)] border border-[var(--color-border)] hover:text-[var(--color-text)] rounded-xl transition-all active:scale-90"
                      title="Descargar"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <nav className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center p-8 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[32px] hover:bg-[var(--color-card)]/80 transition-all active:scale-95 gap-4 group">
            <div className="p-4 bg-[var(--color-background)] rounded-2xl group-hover:bg-[var(--color-quoia-primary)]/10 transition-colors">
              <History className="w-8 h-8 text-[var(--color-text-muted)] group-hover:text-[var(--color-quoia-primary)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Historial</span>
          </button>
          <button className="flex flex-col items-center justify-center p-8 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[32px] hover:bg-[var(--color-card)]/80 transition-all active:scale-95 gap-4 group">
            <div className="p-4 bg-[var(--color-background)] rounded-2xl group-hover:bg-[var(--color-quoia-primary)]/10 transition-colors">
              <Settings className="w-8 h-8 text-[var(--color-text-muted)] group-hover:text-[var(--color-quoia-primary)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Ajustes</span>
          </button>
        </nav>
      </main>

      {/* Footer / App Version info */}
      <footer className="p-10 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">SunSite Digital • Solenium v1.2.0</p>
      </footer>
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
