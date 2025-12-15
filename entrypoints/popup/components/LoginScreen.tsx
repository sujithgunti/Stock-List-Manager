import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginScreenProps {
    onSignIn: () => void;
    isLoading: boolean;
    error?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, isLoading, error }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-background p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">

                {/* Logo Section */}
                <div className="relative group animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="w-24 h-24 rounded-3xl header-gradient flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-105 duration-300">
                        <img src="/icon/96.png" alt="TradeFlow" className="w-14 h-14 object-contain" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute -inset-6 bg-primary-500/30 blur-2xl rounded-full -z-10 animate-pulse-glow"></div>
                </div>

                {/* Text Section */}
                <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h1 className="text-4xl font-bold tracking-tight gradient-text">
                        TradeFlow
                    </h1>
                    <p className="text-sm text-foreground-muted max-w-[280px] mx-auto leading-relaxed">
                        Import, manage, and sync your TradingView watchlists with ease.
                    </p>
                </div>

                {/* Action Section */}
                <div className="w-full max-w-[280px] pt-4 space-y-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={onSignIn}
                        disabled={isLoading}
                        className="w-full group relative flex items-center justify-center gap-3 px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg btn-glow disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Connecting...</span>
                            </div>
                        ) : (
                            <>
                                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4 bg-white rounded-full p-0.5" />
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="text-xs text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20 text-left">
                            <span className="font-semibold block mb-0.5">Authentication Error</span>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="absolute bottom-6 text-center space-y-2">
                    <p className="text-[10px] text-foreground-muted/40 uppercase tracking-widest font-semibold">
                        Version 1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
};
