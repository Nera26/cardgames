import React from 'react';

interface TournamentRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tournamentName: string;
    buyIn: number | string;
    fee: number | string;
    userBalance: number;
}

export const TournamentRegistrationModal: React.FC<TournamentRegistrationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    tournamentName,
    buyIn,
    fee,
    userBalance
}) => {
    if (!isOpen) return null;

    const total = (typeof buyIn === 'number' ? buyIn : 0) + (typeof fee === 'number' ? fee : 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#1a1a1f] rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4">
                    Register for <span className="text-accent-yellow">{tournamentName}</span>
                </h3>
                <div className="text-gray-400 mb-6 space-y-3">
                    <div className="flex justify-between">
                        <span>Buy-in:</span>
                        <span className="text-white font-semibold">${buyIn}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Fee:</span>
                        <span className="text-white">${fee}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-accent-yellow">${total}</span>
                    </div>
                    <p className="text-xs text-right mt-1">
                        Balance: <span className="text-emerald-400">${userBalance.toLocaleString()}</span>
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
                        onClick={onConfirm}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-500 transition-colors font-bold"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
