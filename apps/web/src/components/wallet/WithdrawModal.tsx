import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
    const { user, withdraw } = useGame();
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!user) return;

        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (value > user.balance) {
            setError('Insufficient funds.');
            return;
        }

        try {
            await withdraw({
                amount: value,
                bankAccount: user.accountNumber || undefined,
                comment: 'Web Withdraw'
            });
            setAmount('');
            setError(null);
            onClose();
        } catch (err: unknown) {
            setError((err as any).message || 'Withdrawal failed');
        }
    };

    if (!isOpen) return null;

    return (
        <div id="withdraw-modal" className="fixed inset-0 z-[60] flex items-center justify-center modal-overlay p-4 fade-in">
            <div className="bg-card-bg rounded-2xl p-6 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out opacity-100 scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Withdraw Funds</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-accent-yellow text-2xl">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Withdrawable Amount */}
                <div className="mb-4">
                    <label htmlFor="withdraw-amount" className="block text-sm font-medium text-text-secondary mb-1">Enter Amount (USD)</label>
                    <input
                        type="number"
                        id="withdraw-amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow text-sm"
                    />
                    <p className="text-xs text-text-secondary mt-1">Available: ${user?.balance.toFixed(2)}</p>
                    {error && <p className="text-danger-red text-xs mt-1">{error}</p>}
                </div>

                {/* Bank Account Info (read-only) */}
                <div className="mb-6 bg-primary-bg rounded-xl p-4">
                    {user?.accountNumber ? (
                        <>
                            <p className="text-text-secondary mb-1"><span className="font-semibold">Bank Name:</span> {user?.bankName || 'Not Set'}</p>
                            <p className="text-text-secondary mb-1"><span className="font-semibold">Account Number:</span> {user?.accountNumber}</p>
                            <p className="text-text-secondary mb-1"><span className="font-semibold">IBAN:</span> {user?.iban || 'N/A'}</p>
                            <p className="text-text-secondary"><span className="font-semibold">Account Holder:</span> {user?.accountHolderName || user?.username}</p>
                        </>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-danger-red font-semibold mb-2"><i className="fa-solid fa-triangle-exclamation mr-2"></i>No bank account linked</p>
                            <p className="text-text-secondary text-xs">Please update your Profile to add withdrawal details.</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!user?.accountNumber}
                    className="w-full bg-accent-yellow text-primary-bg font-bold py-3 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base uppercase"
                >
                    Withdraw
                </button>
            </div>
        </div>
    );
};
