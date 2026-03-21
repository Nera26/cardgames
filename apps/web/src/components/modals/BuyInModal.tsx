import React from 'react';

interface BuyInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tableName: string;
    buyInMin: number;
    buyInMax: number;
}

export const BuyInModal: React.FC<BuyInModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    tableName,
    buyInMin,
    buyInMax
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#1a1a1f] rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4">
                    Join <span className="text-accent-yellow">{tableName}</span>
                </h3>
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Buy-in Amount</label>
                    <input
                        type="number"
                        placeholder={`$${buyInMin}`}
                        className="w-full bg-black/40 text-white border border-white/10 rounded-xl p-3 focus:border-accent-yellow outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Range: <span className="text-gray-300">${buyInMin} – ${buyInMax}</span>
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
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-900/20"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
