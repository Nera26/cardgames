import React, { useState } from 'react';
import AdminModal from '@/components/admin/AdminModal';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

export default function ApprovalModal({ isOpen, onClose, onConfirm }: ApprovalModalProps) {
    const [amount, setAmount] = useState<string>('');

    const handleConfirm = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            // Simple validation, could add error state
            return;
        }
        onConfirm(numAmount);
        setAmount('');
        onClose();
    };

    const handleClose = () => {
        setAmount('');
        onClose();
    };

    return (
        <AdminModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Approve Deposit"
            maxWidth="md"
        >
            <div className="space-y-4">
                <p className="text-text-secondary text-sm">
                    Enter the exact amount received from the user. This amount will be credited to their wallet.
                </p>
                <div>
                    <label className="block text-xs uppercase text-text-secondary mb-1">Amount Received ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 500.00"
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-accent-green hover:shadow-[0_0_15px_rgba(28,139,76,0.3)] py-2 rounded-xl font-semibold text-text-primary"
                    >
                        Confirm & Credit
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 bg-hover-bg hover:bg-gray-600 py-2 rounded-xl font-semibold"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </AdminModal>
    );
}
