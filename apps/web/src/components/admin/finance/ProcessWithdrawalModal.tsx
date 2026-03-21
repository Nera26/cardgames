import React, { useState } from 'react';
import { ExtendedTransaction } from '@/hooks/useFinanceData';
import { TransactionType } from '@poker/shared';

interface ProcessWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: ExtendedTransaction | null;
    onConfirm: (id: string, type: TransactionType) => void;
}

export default function ProcessWithdrawalModal({ isOpen, onClose, transaction, onConfirm }: ProcessWithdrawalModalProps) {
    if (!isOpen || !transaction) return null;

    const { user, amount } = transaction;

    const handleConfirm = () => {
        onConfirm(transaction.id, TransactionType.WITHDRAW);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 fade-in-modal">
            <div className="bg-card-bg rounded-2xl w-full max-w-md p-6 border border-accent-blue/50 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-money-bill-transfer text-accent-blue"></i>
                        Process Withdrawal
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">
                        <i className="fa-solid fa-times text-lg"></i>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Amount Card */}
                    <div className="bg-primary-bg p-4 rounded-xl text-center border border-accent-blue/30">
                        <p className="text-text-secondary text-sm uppercase mb-1">Amount to Transfer</p>
                        <p className="text-3xl font-bold text-accent-green">
                            ${Math.abs(amount).toLocaleString()}
                        </p>
                    </div>

                    {/* User Bank Details */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-secondary uppercase border-b border-border-dark pb-2">
                            Bank Details (User: {user?.username})
                        </h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="col-span-2">
                                <p className="text-text-secondary text-xs">Bank Name</p>
                                <p className="font-semibold text-white">{user?.bankName || 'Not Provided'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-text-secondary text-xs">Account Holder</p>
                                <p className="font-semibold text-white">{user?.accountHolderName || 'Not Provided'}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-text-secondary text-xs">Account Number</p>
                                <p className="font-mono text-white break-all">{user?.accountNumber || 'Not Provided'}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-text-secondary text-xs">IBAN</p>
                                <p className="font-mono text-white break-all">{user?.iban || 'Not Provided'}</p>
                            </div>
                        </div>

                        {(!user?.bankName && !user?.iban && !user?.accountNumber) && (
                            <div className="bg-danger-red/10 border border-danger-red/50 p-3 rounded text-xs text-danger-red flex items-center gap-2">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                User has not provided bank details.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            onClick={handleConfirm}
                            className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-check-circle"></i>
                            Confirm Transfer & Approve
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-primary-bg hover:bg-border-dark text-text-secondary font-semibold py-3 rounded-xl transition duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
