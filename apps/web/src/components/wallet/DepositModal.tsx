import React, { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useBankConfig } from '@/hooks/useBankConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy } from '@fortawesome/free-solid-svg-icons';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
    const { deposit } = useGame();
    const { config, isLoading } = useBankConfig();
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (isOpen) {
            setCountdown(10);
            const timer = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (loading || countdown > 0) return;
        setLoading(true);
        try {
            await deposit({ amount: 0, method: 'Bank Transfer' });
            onClose();
        } catch (error) {
            console.error('Deposit failed', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div id="deposit-modal" className="fixed inset-0 z-[60] flex items-center justify-center modal-overlay p-4 fade-in">
            <div className="bg-card-bg rounded-2xl p-6 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out opacity-100 scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Deposit via Bank Transfer</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-accent-yellow text-2xl">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Instructions Panel */}
                        <div className="bg-primary-bg rounded-xl p-4 mb-6 relative overflow-hidden">
                            {!config.isActive && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                                    <p className="text-danger-red font-bold">Deposits are currently disabled</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-border-dark pb-2">
                                    <span className="text-text-secondary">Bank Name</span>
                                    <span className="font-semibold text-right">{config.bankName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-border-dark pb-2">
                                    <span className="text-text-secondary">Account Holder</span>
                                    <span className="font-semibold text-right">{config.holderName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-border-dark pb-2">
                                    <span className="text-text-secondary">IBAN</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-accent-yellow">{config.iban || 'N/A'}</span>
                                        {config.iban && (
                                            <button
                                                onClick={() => copyToClipboard(config.iban)}
                                                className="text-text-secondary hover:text-white transition-colors"
                                                title="Copy IBAN"
                                            >
                                                <FontAwesomeIcon icon={faCopy} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {config.bic && (
                                    <div className="flex justify-between border-b border-border-dark pb-2">
                                        <span className="text-text-secondary">BIC/SWIFT</span>
                                        <span className="font-mono">{config.bic}</span>
                                    </div>
                                )}
                            </div>

                            {config.instructions && (
                                <div className="mt-4 p-3 bg-card-bg rounded-lg border border-accent-yellow/30">
                                    <p className="text-xs text-accent-yellow/90 italic">
                                        Note: {config.instructions}
                                    </p>
                                </div>
                            )}

                            <p className="text-text-secondary text-xs mt-3 text-center">
                                Use your username as the reference.
                            </p>
                            <p className="text-accent-yellow text-xs mt-2 text-center font-semibold">
                                Please send funds to the details above. An admin will credit your account upon receipt.
                            </p>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={loading || !config.isActive || countdown > 0}
                            className={`w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base uppercase ${countdown === 0 && !loading && config.isActive ? 'shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60' : ''}`}
                        >
                            {loading ? 'Processing...' : countdown > 0 ? `Please verify details (${countdown}s)` : "I Have Sent the Deposit"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
