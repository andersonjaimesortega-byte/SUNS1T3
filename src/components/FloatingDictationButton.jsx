import React from 'react';
import { Mic } from 'lucide-react';

const FloatingDictationButton = ({ onStartCapture, activeField }) => {
    return (
        <button
            type="button"
            onClick={() => onStartCapture('smart')}
            className={`btn-action font-black shadow-xl shadow-[var(--color-brand-blue)]/20 text-[var(--color-background)] rounded-full fixed bottom-8 right-8 z-50 p-4 transition-all hover:scale-110 active:scale-95 flex items-center justify-center gap-3 ${activeField ? 'recording bg-[var(--color-error)]' : 'bg-[var(--color-brand-blue)]'}`}
            title="Dictado Inteligente"
        >
            {activeField ? (
                <>
                    <span className="text-xs uppercase tracking-widest font-black mr-2 animate-pulse">Grabando...</span>
                    <Mic className="w-8 h-8 animate-bounce" />
                </>
            ) : (
                <Mic className="w-8 h-8" />
            )}
        </button>
    );
};

export default FloatingDictationButton;
