import React, { useState } from 'react';
import {
    X,
    CheckCircle2,
    Crown,
    ShieldCheck,
    Cloud,
    Zap,
    Loader2
} from 'lucide-react';
import { startSubscriptionFlow } from '../lib/payments';

interface PricingOverlayProps {
    onClose?: () => void;
    isBlocked?: boolean; // If true, cannot close (for expired trial)
}

export function PricingOverlay({ onClose, isBlocked = false }: PricingOverlayProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setLoading(true);
        setError(null);
        try {
            await startSubscriptionFlow();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Payment failed to start');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1E222D] to-[#131722] border border-[#2A2E39] rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

                {/* Decorator Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent pointer-events-none" />

                {/* Close Button (only if not blocked) */}
                {!isBlocked && onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
                    >
                        <X size={18} />
                    </button>
                )}

                <div className="relative p-6 px-7 text-center">
                    {/* Header Icon */}
                    <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-[1px] shadow-lg shadow-orange-500/20">
                        <div className="w-full h-full rounded-2xl bg-[#1E222D] flex items-center justify-center">
                            <Crown size={32} className="text-amber-500 fill-amber-500/10" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Pro</span>
                    </h2>
                    <p className="text-sm text-gray-400 mb-8 px-2">
                        Unlock the full power of TradeFlow and secure your analysis forever.
                    </p>

                    {/* Features List */}
                    <div className="space-y-4 mb-8 text-left">
                        <FeatureRow
                            icon={<Cloud size={18} className="text-blue-400" />}
                            title="Cloud Sync"
                            desc="Access your lists on any device"
                        />
                        <FeatureRow
                            icon={<ShieldCheck size={18} className="text-green-400" />}
                            title="Data Backup"
                            desc="Never lose your work again"
                        />
                        <FeatureRow
                            icon={<Zap size={18} className="text-purple-400" />}
                            title="Unlimited Access"
                            desc="No trial limits, forever"
                        />
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-[#1A1E29] border border-[#2A2E39] rounded-xl p-4 mb-6">
                        <div className="flex items-end justify-center gap-1 mb-1">
                            <span className="text-3xl font-bold text-white">₹99</span>
                            <span className="text-gray-500 mb-1">/month</span>
                        </div>
                        <p className="text-xs text-green-400 font-medium bg-green-900/20 py-0.5 px-2 rounded-full inline-block border border-green-900/30">
                            Risk-free. Cancel anytime.
                        </p>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="mb-4 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/30">
                            {error}
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Upgrade Now
                                <Zap size={18} className="group-hover:text-yellow-300 transition-colors" />
                            </>
                        )}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                        <ShieldCheck size={12} />
                        <span>Secured by Razorpay</span>
                    </div>

                </div>
            </div>
        </div>
    );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-200">{title}</h3>
                <p className="text-xs text-gray-500 leading-tight">{desc}</p>
            </div>
        </div>
    );
}
