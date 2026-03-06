import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ReportForm from './components/ReportForm';
import { generateReportPDF } from './utils/PdfGenerator';
import { LogOut, ClipboardCheck, PlusCircle, History, Settings, FileText } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState([]);

  const handleSaveReport = async (formData) => {
    const filename = await generateReportPDF(formData, user);
    setReports(prev => [{
      id: Date.now(),
      filename,
      date: new Date().toLocaleDateString(),
      minigranja: formData.minigranjaId
    }, ...prev]);
    setShowForm(false);
  };

  if (showForm) {
    return <ReportForm onBack={() => setShowForm(false)} onSave={handleSaveReport} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
          <div>
            <h1 className="text-xl font-bold text-emerald-500">Minigranjas</h1>
            <p className="text-xs text-zinc-400">ID: {user?.id} • {user?.nombre}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        <section className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ClipboardCheck className="text-emerald-500" />
            Reporte de Hoy
          </h2>
          <p className="text-sm text-zinc-400 mb-6">Completa el registro diario de avances y novedades.</p>
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Reporte
          </button>
        </section>

        {reports.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-2">Reportes Recientes</h2>
            {reports.map(report => (
              <div key={report.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <FileText className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{report.filename}</h3>
                    <p className="text-xs text-zinc-500">{report.date} • {report.minigranja}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <nav className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 gap-3">
            <History className="w-8 h-8 text-zinc-400" />
            <span className="text-sm font-medium">Historial</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 gap-3">
            <Settings className="w-8 h-8 text-zinc-400" />
            <span className="text-sm font-medium">Ajustes</span>
          </button>
        </nav>
      </main>

      {/* Footer / App Version info */}
      <footer className="p-8 text-center text-zinc-600">
        <p className="text-xs">Bitácora Digital v1.0.0 (Offline Ready)</p>
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
