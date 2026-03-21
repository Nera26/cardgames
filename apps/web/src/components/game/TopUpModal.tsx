'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faWallet, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { toast } from 'sonner';

interface TopUpModalProps {
    tableId: string;
    isOpen: boolean;
    onClose: () => void;
    /** Table min buy-in from config */
    minBuyIn: number;
    /** Table max buy-in from config */
    maxBuyIn: number;
    /** Hero's current chip stack on the table */
    currentStack: number;
    /** User's main wallet balance */
    walletBalance: number;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
    tableId,
    isOpen,
    onClose,
    minBuyIn,
    maxBuyIn,
    currentStack,
    walletBalance,
}) => {
    // Max allowed top-up = tableMax - currentStack, capped by wallet balance
    const maxTopUp = Math.min(maxBuyIn - currentStack, walletBalance);
    // Min top-up should be the table minimum or whatever's left to reach it
    const minTopUp = Math.min(minBuyIn, maxTopUp);
    const canTopUp = maxTopUp > 0 && currentStack < maxBuyIn;

    const [amount, setAmount] = useState(maxTopUp);
    const [isLoading, setIsLoading] = useState(false);

    // Reset amount when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setAmount(Math.max(minTopUp, Math.min(maxTopUp, minBuyIn)));
        }
    }, [isOpen, maxTopUp, minTopUp, minBuyIn]);

    const handleTopUp = async () => {
        if (amount <= 0 || isLoading) return;
        setIsLoading(true);

        try {
            const { data } = await api.post('/game/rebuy', {
                tableId,
                amount,
            });

            if (data.success) {
                toast.success(`Added $${amount.toLocaleString()} to your stack`);
                onClose();
            } else {
                toast.error(data.message || 'Top up failed');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
                >
                    <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCoins} className="text-2xl text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Top Up Chips</h2>
                    <p className="text-slate-400 text-sm mt-1">Add chips to your stack</p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-800/70 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <FontAwesomeIcon icon={faWallet} className="text-xs text-blue-400" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Wallet</span>
                        </div>
                        <p className="text-white font-bold text-lg">${walletBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/70 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <FontAwesomeIcon icon={faCoins} className="text-xs text-amber-400" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Current Stack</span>
                        </div>
                        <p className="text-white font-bold text-lg">${currentStack.toLocaleString()}</p>
                    </div>
                </div>

                {/* Top-up Amount */}
                {canTopUp ? (
                    <div className="mb-6">
                        {/* Quick-pick presets */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { label: 'Min', value: minTopUp },
                                { label: '25%', value: Math.round(maxTopUp * 0.25) },
                                { label: '50%', value: Math.round(maxTopUp * 0.5) },
                                { label: '75%', value: Math.round(maxTopUp * 0.75) },
                                { label: 'Max', value: maxTopUp },
                            ]
                                .filter(p => p.value >= minTopUp && p.value <= maxTopUp)
                                .map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setAmount(preset.value)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${amount === preset.value
                                            ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                        </div>

                        <label className="block text-slate-400 text-sm mb-2">
                            Top Up: <span className="text-emerald-400 font-bold">${amount.toLocaleString()}</span>
                        </label>
                        <input
                            type="range"
                            min={minTopUp}
                            max={maxTopUp}
                            step={Math.max(1, Math.floor((maxTopUp - minTopUp) / 100))}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>${minTopUp.toLocaleString()}</span>
                            <span>${maxTopUp.toLocaleString()}</span>
                        </div>


                        <p className="text-xs text-slate-500 mt-2 text-center">
                            After top-up: <span className="text-white font-medium">${(currentStack + amount).toLocaleString()}</span>
                            <span className="text-slate-600"> / ${maxBuyIn.toLocaleString()} max</span>
                        </p>
                    </div>
                ) : (
                    <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                        <p className="text-amber-400 text-sm font-medium">
                            {currentStack >= maxBuyIn
                                ? 'Your stack is already at the table maximum.'
                                : 'Insufficient wallet balance for a top up.'}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTopUp}
                        disabled={isLoading || !canTopUp}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : `Add $${amount.toLocaleString()}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
