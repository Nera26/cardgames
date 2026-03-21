'use client';

import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import StatusBadge from '@/components/admin/StatusBadge';

export default function WalletPage() {
    const { user, isLoading } = useGame();
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            {/* ========== MAIN CONTENT ========== */}
            <main id="wallet-page-content" className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:py-32px min-h-[calc(100vh-150px)]">

                {/* ===== 1. BALANCE OVERVIEW ===== */}
                <section id="balance-overview-section" className="bg-card-bg rounded-2xl p-20px md:p-32px mb-24px md:mb-32px shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm sm:text-base">Total Balance</p>
                            {/* Display Real + Credit */}
                            <p className="text-3xl sm:text-4xl font-bold text-accent-yellow" id="total-balance-display">${(user?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-sm sm:text-base text-text-secondary">
                                <span className="font-medium">• Real: <span id="real-balance-display">${(user?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
                                &nbsp;|&nbsp;
                                <span className="font-medium tooltip">• Credit: <span id="credit-balance-display">$0.00</span>
                                    <span className="tooltip-text">Credits can only be used for games and cannot be withdrawn.</span>
                                </span>
                            </p>
                        </div>
                        <div className="mt-6 md:mt-0 flex space-x-4">
                            <button
                                id="open-deposit-modal-button"
                                className="bg-accent-green text-text-primary font-bold py-3 px-6 rounded-xl hover:brightness-110 hover-glow-green transition-all duration-200 text-sm sm:text-base uppercase flex items-center"
                                onClick={() => setIsDepositOpen(true)}
                            >
                                <i className="fa-solid fa-arrow-down mr-2"></i> Deposit
                            </button>
                            <button
                                id="open-withdraw-modal-button"
                                className="border-2 border-accent-yellow text-accent-yellow font-bold py-3 px-6 rounded-xl hover:bg-accent-yellow hover:text-primary-bg hover-glow-yellow transition-all duration-200 text-sm sm:text-base uppercase flex items-center"
                                onClick={() => setIsWithdrawOpen(true)}
                            >
                                <i className="fa-solid fa-arrow-up mr-2"></i> Withdraw
                            </button>
                        </div>
                    </div>
                </section>

                {/* ===== 2. PENDING TRANSACTIONS ===== */}
                <section id="pending-transactions-section" className="mb-24px md:mb-32px">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">Pending Transactions</h2>
                    <div id="pending-transactions-list" className="space-y-3">
                        {(user?.transactions || []).filter(tx => tx.status === 'PENDING').length > 0 ? (
                            (user?.transactions || [])
                                .filter(tx => tx?.status === 'PENDING')
                                .map(tx => (
                                    <div key={tx?.id}
                                        className="bg-card-bg p-4 rounded-xl flex justify-between items-center hover:bg-hover-bg transition-colors duration-200">
                                        <div>
                                            <p className="text-text-primary font-medium">
                                                {tx?.type === 'DEPOSIT' ? 'Deposit' : tx?.type === 'WITHDRAW' ? 'Withdraw' : tx?.type}
                                                {tx?.description ? ` - ${tx?.description}` : ''}
                                            </p>
                                            <p className="text-text-secondary text-sm">
                                                Amount: <span className={tx?.amount ? (tx?.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400') : 'text-amber-400 italic'}>
                                                    {tx?.amount ? `$${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Awaiting confirmation'}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <StatusBadge status="pending" />
                                            <p className="text-xs text-text-secondary">{new Date(tx?.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div id="no-pending-transactions"
                                className="bg-card-bg p-20px rounded-xl text-center text-text-secondary">
                                <i className="fa-solid fa-hourglass-half text-3xl mb-2 text-accent-yellow"></i>
                                <p>No pending transactions at the moment.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== 3. TRANSACTION HISTORY ===== */}
                <section id="transaction-history-section">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">Transaction History</h2>
                    <div className="bg-card-bg rounded-2xl overflow-x-auto shadow-md">
                        {(user?.transactions || []).filter(tx => tx?.status !== 'PENDING').length > 0 ? (
                            <table id="transaction-history-table" className="w-full min-w-[700px]">
                                <thead className="border-b border-border-dark">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">Type</th>
                                        <th className="text-right p-4 font-semibold text-text-secondary text-sm uppercase">Amount</th>
                                        <th className="text-right p-4 font-semibold text-text-secondary text-sm uppercase">Running Balance</th>
                                        <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">Date &amp; Time</th>
                                        <th className="text-left p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody id="history-rows">
                                    {(user?.transactions || []).filter(tx => tx?.status !== 'PENDING').map(tx => {
                                        const amt = tx?.amount ?? 0;
                                        const isPositive = amt > 0;
                                        const typeLabels: Record<string, string> = {
                                            DEPOSIT: 'Deposit',
                                            WITHDRAW: 'Withdrawal',
                                            BUY_IN: 'Table Buy-In',
                                            CASH_OUT: 'Table Cash-Out',
                                            BONUS: 'Bonus',
                                            RAKE: 'Rake',
                                        };
                                        const label = typeLabels[tx?.type] || tx?.type;
                                        const desc = tx?.description ? ` (${tx.description})` : '';
                                        const balAfter = (tx as any)?.balanceAfter;

                                        return (
                                            <tr key={tx?.id} className="border-b border-border-dark hover:bg-hover-bg transition-colors duration-200">
                                                <td className="p-4 text-text-primary text-sm">
                                                    <span className="font-medium">{label}</span>
                                                    <span className="text-text-secondary text-xs block">{desc}</span>
                                                </td>
                                                <td className={`p-4 font-semibold text-sm text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isPositive ? '+' : ''}{amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4 text-sm text-right text-accent-yellow font-medium">
                                                    {balAfter != null ? `$${Number(balAfter).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                                                </td>
                                                <td className="p-4 text-text-secondary text-sm">{new Date(tx?.createdAt).toLocaleString()}</td>
                                                <td className="p-4 text-sm">
                                                    <StatusBadge status={tx?.status?.toLowerCase() as any} />
                                                    {tx?.status === 'REJECTED' && tx?.rejectionReason && (
                                                        <span className="text-red-400 text-xs mt-1 block">
                                                            {tx.rejectionReason}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div id="no-transaction-history" className="p-20px text-center text-text-secondary">
                                <i className="fa-solid fa-receipt text-3xl mb-2 text-accent-yellow"></i>
                                <p>No transaction history found.</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>

            {/* ========== MODALS ========== */}
            <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
            <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
        </>
    );
}
