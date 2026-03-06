import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        const result = login(userId.toUpperCase());
        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-900 text-zinc-100">
            <div className="w-full max-w-md bg-zinc-800 p-8 rounded-2xl shadow-xl border border-zinc-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
                        <ShieldCheck className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-center">Bitácora Digital</h1>
                    <p className="text-zinc-400 text-sm">Acceso para Personal de Campo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="userId" className="block text-sm font-medium mb-2 text-zinc-300">
                            ID de Usuario
                        </label>
                        <input
                            id="userId"
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Ej: ING001"
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                    >
                        <LogIn className="w-5 h-5" />
                        Entrar al Sistema
                    </button>
                </form>

                <p className="mt-8 text-center text-xs text-zinc-500">
                    Uso exclusivo para personal autorizado de Minigranjas.
                </p>
            </div>
        </div>
    );
};

export default Login;
