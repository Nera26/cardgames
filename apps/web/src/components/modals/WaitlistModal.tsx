import React from 'react';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    tableName: string;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
    isOpen,
    onClose,
    tableName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#1a1a1f] rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4">Added to Waitlist</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    You've been added to the waitlist for{' '}
                    <span className="text-accent-yellow font-semibold">{tableName}</span>.
                    We'll notify you when a seat opens.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-500 transition-colors font-bold shadow-lg shadow-blue-900/20"
                >
                    Got it
                </button>
            </div>
        </div>
    );
};
