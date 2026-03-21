import React from 'react';

interface SeatAvailableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin: () => void;
    tableName: string;
}

export const SeatAvailableModal: React.FC<SeatAvailableModalProps> = ({
    isOpen,
    onClose,
    onJoin,
    tableName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#1a1a1f] rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4">Seat Available!</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    A seat is now available at{' '}
                    <span className="text-accent-yellow font-semibold">{tableName}</span>.
                    Would you like to join now?
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={onJoin}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-500 transition-colors font-bold"
                    >
                        Join Now
                    </button>
                </div>
            </div>
        </div>
    );
};
