'use client';

import React, { useState } from 'react';
import { TransactionType, TransactionStatus } from '@poker/shared';
import { useFinanceData } from '@/hooks/useFinanceData';
import FinanceFilters from '@/components/admin/finance/FinanceFilters';
import TransactionSection from '@/components/admin/finance/TransactionSection';
import UnifiedLogSection from '@/components/admin/finance/UnifiedLogSection';
import IbanManagerModal from '@/components/admin/finance/IbanManagerModal';
import ApprovalModal from '@/components/admin/finance/ApprovalModal';
import ProcessWithdrawalModal from '@/components/admin/finance/ProcessWithdrawalModal';
import RejectionModal from '@/components/admin/finance/RejectionModal';
import ReconciliationPanel from '@/components/admin/finance/ReconciliationPanel';
import { ExtendedTransaction } from '@/hooks/useFinanceData';

export default function FinancePage() {
    const {
        activeFilter,
        setActiveFilter,
        transactions,
        isLoading,
        currentPage,
        totalPages,
        setCurrentPage,
        actions
    } = useFinanceData();

    // UI State for modals
    const [isIbanModalOpen, setIsIbanModalOpen] = useState(false);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isProcessWithdrawalOpen, setIsProcessWithdrawalOpen] = useState(false);
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);

    // Derived state for specific sections
    const depositRequests = transactions.filter(t => t.type === TransactionType.DEPOSIT && t.status === TransactionStatus.PENDING);
    const withdrawalRequests = transactions.filter(t => t.type === TransactionType.WITHDRAW && t.status === TransactionStatus.PENDING);

    const openRejectModal = (id: string) => {
        setSelectedTxId(id);
        setIsRejectionModalOpen(true);
    };

    const handleConfirmReject = (reason: string) => {
        if (selectedTxId) {
            const tx = transactions.find(t => t.id === selectedTxId);
            if (tx) {
                actions.handleRejectApi(selectedTxId, tx.type, reason);
            }
        }
    };

    const handleOpenApprove = (id: string, type: TransactionType) => {
        if (type === TransactionType.DEPOSIT) {
            setSelectedTxId(id);
            setIsApprovalModalOpen(true);
        } else if (type === TransactionType.WITHDRAW) {
            const tx = transactions.find(t => t.id === id);
            if (tx) {
                setSelectedTransaction(tx);
                setIsProcessWithdrawalOpen(true);
            }
        }
    };

    const handleConfirmApproval = (amount: number) => {
        if (selectedTxId) {
            actions.handleApprove(selectedTxId, TransactionType.DEPOSIT, amount);
        }
    };

    const handleConfirmWithdrawal = (id: string) => {
        actions.handleApprove(id, TransactionType.WITHDRAW);
    };

    return (
        <div className="space-y-6">
            {/* System Reconciliation — Yellow Cable Heartbeat */}
            <ReconciliationPanel />

            <FinanceFilters active={activeFilter} onChange={setActiveFilter} />

            {(activeFilter === 'all' || activeFilter === 'deposits') && (
                <TransactionSection
                    title="Deposit Requests"
                    data={depositRequests}
                    type={TransactionType.DEPOSIT}
                    onApprove={handleOpenApprove}
                    onReject={openRejectModal}
                />
            )}

            {(activeFilter === 'all' || activeFilter === 'withdrawals') && (
                <TransactionSection
                    title="Withdrawal Requests"
                    data={withdrawalRequests}
                    type={TransactionType.WITHDRAW}
                    onApprove={handleOpenApprove}
                    onReject={openRejectModal}
                />
            )}

            <UnifiedLogSection
                transactions={transactions}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onManageIban={() => setIsIbanModalOpen(true)}
            />

            <IbanManagerModal
                isOpen={isIbanModalOpen}
                onClose={() => setIsIbanModalOpen(false)}
            />

            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onConfirm={handleConfirmReject}
            />

            <ApprovalModal
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                onConfirm={handleConfirmApproval}
            />

            <ProcessWithdrawalModal
                isOpen={isProcessWithdrawalOpen}
                onClose={() => setIsProcessWithdrawalOpen(false)}
                transaction={selectedTransaction}
                onConfirm={handleConfirmWithdrawal}
            />
        </div>
    );
}
