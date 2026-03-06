import React, { useState } from 'react';
import {
    ArrowLeft, User, Database, Shield, Github,
    RefreshCcw, LogOut, Trash2, Check, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SettingsView = ({ onBack }) => {
    const { user, logout, syncUsers, updateUserName } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [newName, setNewName] = useState(user?.nombre || '');

    const handleSync = async () => {
        setSyncing(true);
        await syncUsers();
        setTimeout(() => setSyncing(false), 800);
    };

    const handleUpdateName = () => {
        if (newName.trim()) {
            updateUserName(newName.trim());
            alert('Nombre técnico actualizado correctamente.');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-24 font-[family:var(--font-primary)]">
            <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 sticky top-0 z-20 flex items-center gap-4">
                <button onClick={onBack} className="p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-card)]/80 rounded-xl transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-widest text-[var(--color-quoia-primary)]">Panel de Control</h1>
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Configuración de SunSite</p>
                </div>
            </header>

            <main className="p-5 max-w-xl mx-auto space-y-6">
                {/* Profile Section */}
                <section className="bg-white border border-[var(--color-border)] p-8 rounded-[32px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <User size={100} className="text-[var(--color-brand-blue)]" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-[var(--color-brand-blue)]/10 rounded-[28px] flex items-center justify-center border-2 border-[var(--color-brand-blue)]/20 shadow-inner">
                                <span className="text-3xl font-black text-[var(--color-brand-blue)]">{user?.nombre?.charAt(0)}</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-800">{user?.nombre}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{user?.rol}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-1">Nombre Completo del Ingeniero</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--color-brand-blue)] text-slate-700"
                                        placeholder="Nombre del Ingeniero"
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        className="p-3 bg-[var(--color-brand-blue)] text-white rounded-xl shadow-lg shadow-[var(--color-brand-blue)]/20 active:scale-95 transition-all flex items-center justify-center shrink-0 w-12 h-12"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sincronización */}
                <section className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-[var(--color-quoia-primary)]" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Datos y Sincronización</h3>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-[var(--color-success)] uppercase">
                            <Check className="w-3 h-3" /> Online
                        </span>
                    </div>

                    <div className="bg-[var(--color-background)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Base de Datos Supabase</p>
                            <p className="text-xs font-black">Sincronización Automática</p>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className={`p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:text-[var(--color-quoia-primary)] transition-all ${syncing ? 'animate-spin opacity-50' : ''}`}
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-[9px] text-[var(--color-text-muted)] italic leading-relaxed px-2">
                        SunSite guarda una copia local de los usuarios para que puedas trabajar sin conexión. Se sincronizará automáticamente al detectar red.
                    </p>
                </section>

                {/* Info y Acciones */}
                <section className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-3xl flex flex-col items-center gap-3 hover:border-[var(--color-quoia-primary)]/40 transition-all opacity-50 cursor-not-allowed">
                            <Shield className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-tight text-center">Términos de Uso</span>
                        </button>
                        <button className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-3xl flex flex-col items-center gap-3 hover:border-[var(--color-quoia-primary)]/40 transition-all opacity-50 cursor-not-allowed">
                            <Github className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-tight text-center">Repositorio</span>
                        </button>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 font-black py-4.5 rounded-[28px] flex items-center justify-center gap-3 hover:bg-[var(--color-error)] hover:text-white transition-all active:scale-[0.98] text-xs uppercase tracking-widest mt-4"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión Oficial
                    </button>
                </section>

                <footer className="text-center py-6">
                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.3em]">Solenium Dev Division • SunSite 2026</p>
                </footer>
            </main>
        </div>
    );
};

export default SettingsView;
