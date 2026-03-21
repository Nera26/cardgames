import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUniversity,
    faEye,
    faEyeSlash,
    faSave,
    faUndo,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import AdminModal from '@/components/admin/AdminModal';
import { useBankConfig } from '@/hooks/useBankConfig';

interface IbanManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}



export default function IbanManagerModal({ isOpen, onClose }: IbanManagerModalProps) {
    const { config, updateConfig, isLoading, history, isHistoryLoading, restoreConfig } = useBankConfig({ isAdmin: true });
    const [ibanVisible, setIbanVisible] = useState(false);

    // Form state
    const [newIban, setNewIban] = useState('');
    const [newBankName, setNewBankName] = useState('');
    const [newHolder, setNewHolder] = useState('');
    const [newInstructions, setNewInstructions] = useState('');
    const [ibanError, setIbanError] = useState('');

    const validateIban = (iban: string): boolean => {
        const cleanIban = iban.replace(/\s/g, '').toUpperCase();
        if (!cleanIban) return false;

        // Relaxed validation: Just length check (10-34 chars)
        if (cleanIban.length < 10 || cleanIban.length > 34) {
            setIbanError('IBAN must be between 10 and 34 characters');
            return false;
        }

        setIbanError('');
        return true;
    };

    const handleIbanUpdate = () => {
        if (validateIban(newIban) && newHolder.trim() && newBankName.trim()) {
            updateConfig.mutate({
                iban: newIban,
                bankName: newBankName,
                holderName: newHolder,
                instructions: newInstructions || config.instructions,
                isActive: true,
            }, {
                onSuccess: () => {
                    onClose();
                    resetIbanForm();
                }
            });
        }
    };

    const resetIbanForm = () => {
        setNewIban('');
        setNewBankName('');
        setNewHolder('');
        setNewInstructions('');
        setIbanError('');
    };

    // Mask IBAN for display
    const maskedIban = config.iban
        ? `${config.iban.slice(0, 4)} **** **** ${config.iban.slice(-4)}`
        : '****';

    if (isLoading) return null;

    return (
        <AdminModal
            isOpen={isOpen}
            onClose={onClose}
            title="Deposit IBAN Manager"
            maxWidth="4xl"
        >
            <div className="space-y-6">
                {/* 1. Current Active IBAN Display */}
                <div className="bg-primary-bg p-6 rounded-2xl border border-border-dark">
                    <h4 className="font-bold text-accent-yellow mb-4 uppercase text-xs tracking-wider">Current Active IBAN</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <label className="text-xs text-text-secondary block mb-1">Bank Name</label>
                            <div className="text-lg text-white font-semibold mb-3">
                                {config.bankName || 'Not Set'}
                            </div>
                            <label className="text-xs text-text-secondary block mb-1">IBAN</label>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-lg text-white tracking-wider">
                                    {ibanVisible ? config.iban : maskedIban}
                                </span>
                                <button
                                    onClick={() => setIbanVisible(!ibanVisible)}
                                    className="text-accent-blue hover:text-blue-400 transition-colors"
                                    title="Toggle Visibility"
                                >
                                    <FontAwesomeIcon icon={ibanVisible ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary block mb-1">Account Holder</label>
                            <div className="text-lg text-white font-semibold">
                                {config.holderName || 'Not Set'}
                            </div>
                        </div>
                        <div className="md:col-span-2 border-t border-border-dark pt-4 mt-2">
                            <label className="text-xs text-text-secondary block mb-1">Deposit Instructions</label>
                            <p className="text-sm text-white/90">{config.instructions || 'No instructions set.'}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Update IBAN Form */}
                <div className="bg-primary-bg p-6 rounded-2xl border border-border-dark">
                    <h4 className="font-bold text-accent-green mb-4 uppercase text-xs tracking-wider">Update IBAN Details</h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Bank Name *</label>
                                <input
                                    type="text"
                                    value={newBankName}
                                    onChange={(e) => setNewBankName(e.target.value)}
                                    className="w-full bg-card-bg border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-accent-yellow focus:outline-none transition-colors"
                                    placeholder="Commerzbank"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">New IBAN *</label>
                                <input
                                    type="text"
                                    value={newIban}
                                    onChange={(e) => {
                                        setNewIban(e.target.value.toUpperCase());
                                        if (ibanError) validateIban(e.target.value);
                                    }}
                                    className={`w-full bg-card-bg border ${ibanError ? 'border-danger-red' : 'border-border-dark'} rounded-xl px-4 py-3 text-sm font-mono focus:border-accent-yellow focus:outline-none transition-colors`}
                                    placeholder="DE89..."
                                />
                                {ibanError && <p className="text-danger-red text-xs mt-1">{ibanError}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Account Holder Name *</label>
                            <input
                                type="text"
                                value={newHolder}
                                onChange={(e) => setNewHolder(e.target.value)}
                                className="w-full bg-card-bg border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-accent-yellow focus:outline-none transition-colors"
                                placeholder="Company Name / Holder"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Deposit Instructions</label>
                            <textarea
                                value={newInstructions}
                                onChange={(e) => setNewInstructions(e.target.value)}
                                className="w-full bg-card-bg border border-border-dark rounded-xl px-4 py-3 text-sm h-24 focus:border-accent-yellow focus:outline-none resize-none transition-colors"
                                placeholder="Payment reference instructions..."
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={handleIbanUpdate}
                                disabled={!newIban || !newHolder || !newBankName || updateConfig.isPending}
                                className="bg-accent-green hover:shadow-[0_0_15px_rgba(28,139,76,0.3)] px-6 py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                {updateConfig.isPending ? 'Updating...' : 'Update IBAN'}
                            </button>
                            <button
                                onClick={resetIbanForm}
                                className="bg-hover-bg hover:bg-gray-600 px-6 py-2.5 rounded-xl font-bold text-white transition-all"
                            >
                                <FontAwesomeIcon icon={faUndo} className="mr-2" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Change History Log */}
                <div className="bg-primary-bg p-6 rounded-2xl border border-border-dark">
                    <h4 className="font-bold text-accent-blue mb-4 uppercase text-xs tracking-wider">Change History</h4>
                    {isHistoryLoading ? (
                        <div className="flex justify-center p-4">
                            <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-dark">
                                        <th className="text-left py-2 px-3 text-text-secondary font-medium">Date</th>
                                        <th className="text-left py-2 px-3 text-text-secondary font-medium">Old IBAN</th>
                                        <th className="text-left py-2 px-3 text-text-secondary font-medium">New IBAN</th>
                                        <th className="text-left py-2 px-3 text-text-secondary font-medium">Updated By</th>
                                        <th className="text-left py-2 px-3 text-text-secondary font-medium">Notes</th>
                                        <th className="text-left py-2 px-3 text-text-secondary font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(history || []).map((hist: any) => (
                                        <tr key={hist.id} className="border-b border-border-dark/50 hover:bg-hover-bg transition-colors">
                                            <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                                                {new Date(hist.createdAt || hist.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-xs text-white/70">
                                                {hist.iban ? `**** ${hist.iban.slice(-4)}` : hist.oldIban}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-xs text-white">
                                                {hist.iban || hist.newIban}
                                            </td>
                                            <td className="py-3 px-3 text-white">
                                                <div className="flex items-center gap-2">
                                                    {hist.adminAvatar ? (
                                                        <img
                                                            src={hist.adminAvatar}
                                                            alt={hist.adminName || 'Admin'}
                                                            className="w-6 h-6 rounded-full object-cover border border-border-light"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-[10px] font-bold text-accent-blue border border-accent-blue/30">
                                                            {(hist.adminName || hist.updatedBy || 'A')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span>{hist.adminName || hist.updatedBy}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-text-secondary max-w-[200px] truncate" title={hist.note || hist.notes}>{hist.note || hist.notes}</td>
                                            <td className="py-3 px-3">
                                                <button
                                                    onClick={() => restoreConfig.mutate(hist.id)}
                                                    disabled={restoreConfig.isPending}
                                                    className="bg-accent-yellow text-black px-3 py-1 rounded-lg text-xs font-bold hover:shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all disabled:opacity-50"
                                                >
                                                    {restoreConfig.isPending ? '...' : 'Reuse'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!history || history.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4 text-text-secondary">No history found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminModal>
    );
}
