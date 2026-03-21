import React from 'react';

interface InsufficientBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeposit: () => void;
    currentBalance: number;
    requiredAmount: number;
}

export const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
    isOpen,
    onClose,
    onDeposit,
    currentBalance,
    requiredAmount
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#1a1a1f] rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4">Insufficient Balance</h3>
                <div className="text-gray-400 mb-6 space-y-2">
                    <p className="flex justify-between">
                        <span>Current Balance:</span>
                        <span className="text-accent-yellow font-semibold">${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Minimum Required:</span>
                        <span className="text-rose-500 font-semibold">${requiredAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDeposit}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-500 transition-colors font-bold"
                    >
                        Deposit Now
                    </button>
                </div>
            </div>
        </div>
    );
};
