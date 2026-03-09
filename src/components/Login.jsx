import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(userId.toUpperCase());
        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-background)] text-[var(--color-text)] font-[family:var(--font-primary)]">
            <div className="w-full max-w-sm bg-[var(--color-card)] p-10 rounded-[40px] shadow-2xl border border-[var(--color-border)] relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-quoia-primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-quoia-primary)]/20 transition-all duration-700"></div>

                <div className="flex flex-col items-center mb-10 relative z-10">
                    <div className="bg-[var(--color-quoia-primary)]/10 p-5 rounded-3xl mb-5 shadow-inner">
                        <ShieldCheck className="w-14 h-14 text-[var(--color-quoia-primary)]" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-center uppercase mb-1">SunSite</h1>
                    <p className="text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-[0.3em]">Acceso Personal Campo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label htmlFor="userId" className="block text-xs font-black uppercase tracking-widest ml-1 text-slate-500">
                            Identificación ID
                        </label>
                        <input
                            id="userId"
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Ej: ING-002"
                            className="w-full px-5 py-4 bg-white border border-[var(--color-border)] rounded-2xl focus:ring-2 focus:ring-[var(--color-brand-blue)]/50 focus:border-[var(--color-brand-blue)] transition-all outline-none font-bold text-slate-800"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-[var(--color-error)] text-xs font-bold bg-[var(--color-error)]/10 p-4 rounded-2xl border border-[var(--color-error)]/20 animate-pulse">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 active:scale-[0.98] text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[var(--color-brand-blue)]/20 text-sm uppercase tracking-widest"
                    >
                        <LogIn className="w-5 h-5 font-bold" />
                        Validar Acceso
                    </button>
                </form>

                <p className="mt-10 text-center text-[10px] text-[var(--color-text-muted)] font-medium leading-relaxed uppercase tracking-wider opacity-60">
                    Solenium Development Division<br />Sunsite Digital Project © 2026
                </p>
            </div>
        </div>
    );
};

export default Login;
